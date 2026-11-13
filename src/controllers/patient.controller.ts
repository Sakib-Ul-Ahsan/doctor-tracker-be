import { Request, Response } from "express";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildDateRangeFilter, escapeRegex } from "../utils/queryHelpers";
import { logActivity } from "../utils/activityLogger";
import {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from "../validators/patient.validator";

export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery || req.query) as unknown as ListPatientsQuery;
  const { search, condition, doctorId, startDate, endDate, page, limit, sortBy, sortOrder } =
    query;

  const filter: Record<string, unknown> = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { condition: regex }];
  }

  if (condition && condition !== "all") {
    filter.condition = new RegExp(`^${escapeRegex(condition)}$`, "i");
  }

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  const createdAtRange = buildDateRangeFilter(startDate, endDate);
  if (createdAtRange) {
    filter.createdAt = createdAtRange;
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [patients, total, conditions] = await Promise.all([
    Patient.find(filter)
      .sort({ [sortBy]: sortDirection, _id: 1 })
      .skip(skip)
      .limit(limit)
      .populate("doctorId", "name specialization hospital")
      .lean(),
    Patient.countDocuments(filter),
    Patient.distinct("condition"),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return sendSuccess(
    res,
    200,
    {
      patients,
      filters: {
        conditions: conditions.sort((a: string, b: string) => a.localeCompare(b)),
      },
    },
    {
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  );
});

export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreatePatientInput;

  const doctorExists = await Doctor.exists({ _id: payload.doctorId });
  if (!doctorExists) {
    throw new AppError(404, "Assigned doctor does not exist", {
      code: "DOCTOR_NOT_FOUND",
    });
  }

  const created = await Patient.create(payload);
  const patient = await Patient.findById(created._id)
    .populate("doctorId", "name specialization hospital")
    .lean();

  const doctorName = (patient?.doctorId as any)?.name ?? "physician";
  void logActivity(
    "patient_created",
    `Registered patient ${created.name} (${created.age} yrs, ${created.gender}) under ${doctorName} for ${created.condition}`,
    "patient",
    created._id.toString(),
    { condition: created.condition, doctorId: payload.doctorId }
  );

  return sendSuccess(
    res,
    201,
    { patient },
    { message: "Patient registered successfully" }
  );
});

export const getPatientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const patient = await Patient.findById(id)
    .populate("doctorId", "name specialization hospital phone email")
    .lean();

  if (!patient) {
    throw new AppError(404, "Patient not found", { code: "PATIENT_NOT_FOUND" });
  }

  return sendSuccess(res, 200, { patient });
});

export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as UpdatePatientInput;

  const existingPatient = await Patient.findById(id).lean();
  if (!existingPatient) {
    throw new AppError(404, "Patient not found", { code: "PATIENT_NOT_FOUND" });
  }

  if (payload.doctorId) {
    const doctorExists = await Doctor.exists({ _id: payload.doctorId });
    if (!doctorExists) {
      throw new AppError(404, "Assigned doctor does not exist", {
        code: "DOCTOR_NOT_FOUND",
      });
    }
  }

  const patient = await Patient.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("doctorId", "name specialization hospital")
    .lean();

  if (!patient) {
    throw new AppError(404, "Patient not found", { code: "PATIENT_NOT_FOUND" });
  }

  const isReassigned =
    payload.doctorId &&
    payload.doctorId.toString() !== existingPatient.doctorId?.toString();

  if (isReassigned) {
    const newDoctorName = (patient.doctorId as any)?.name ?? "new physician";
    void logActivity(
      "patient_reassigned",
      `Transferred care of patient ${patient.name} to ${newDoctorName}`,
      "patient",
      id,
      { newDoctorId: payload.doctorId }
    );
  } else {
    void logActivity(
      "patient_updated",
      `Updated clinical information for patient ${patient.name}`,
      "patient",
      id
    );
  }

  return sendSuccess(
    res,
    200,
    { patient },
    { message: "Patient updated successfully" }
  );
});

export const deletePatient = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const patient = await Patient.findByIdAndDelete(id).lean();
  if (!patient) {
    throw new AppError(404, "Patient not found", { code: "PATIENT_NOT_FOUND" });
  }

  void logActivity(
    "patient_deleted",
    `Discharged patient record for ${patient.name} (${patient.condition})`,
    "patient",
    id
  );

  return sendSuccess(
    res,
    200,
    { deletedId: id },
    { message: "Patient record deleted successfully" }
  );
});

export const bulkDeletePatients = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError(400, "Please provide an array of patient IDs to delete");
  }

  const result = await Patient.deleteMany({ _id: { $in: ids } });

  void logActivity(
    "patient_deleted",
    `Bulk discharged ${result.deletedCount} patient record(s)`,
    "patient"
  );

  return sendSuccess(res, 200, {
    deletedCount: result.deletedCount,
    deletedIds: ids,
  });
});
