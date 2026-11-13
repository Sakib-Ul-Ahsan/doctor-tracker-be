import { Request, Response } from "express";
import mongoose from "mongoose";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildDateRangeFilter, escapeRegex } from "../utils/queryHelpers";
import {
  CreateDoctorInput,
  ListDoctorsQuery,
  UpdateDoctorInput,
} from "../validators/doctor.validator";

export const getDoctors = asyncHandler(async (req: Request, res: Response) => {
  const query = (res.locals.validatedQuery || req.query) as unknown as ListDoctorsQuery;
  const { search, specialization, startDate, endDate, page, limit, sortBy, sortOrder } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: regex }, { specialization: regex }, { hospital: regex }];
  }

  if (specialization && specialization !== "all") {
    filter.specialization = new RegExp(`^${escapeRegex(specialization)}$`, "i");
  }

  const createdAtRange = buildDateRangeFilter(startDate, endDate);
  if (createdAtRange) {
    filter.createdAt = createdAtRange;
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [aggregationResult, specializations] = await Promise.all([
    Doctor.aggregate([
      { $match: filter },
      { $sort: { [sortBy]: sortDirection, _id: 1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "patients",
                localField: "_id",
                foreignField: "doctorId",
                as: "patients",
              },
            },
            {
              $addFields: {
                patientCount: { $size: "$patients" },
              },
            },
            {
              $project: {
                patients: 0,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]),
    Doctor.distinct("specialization"),
  ]);

  const items = aggregationResult[0]?.items ?? [];
  const total = aggregationResult[0]?.totalCount[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return sendSuccess(
    res,
    200,
    {
      doctors: items,
      filters: {
        specializations: specializations.sort((a: string, b: string) => a.localeCompare(b)),
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

export const createDoctor = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as CreateDoctorInput;
  const doctor = await Doctor.create(payload);

  return sendSuccess(
    res,
    201,
    {
      doctor: {
        ...doctor.toObject(),
        patientCount: 0,
      },
    },
    { message: "Doctor created successfully" }
  );
});

export const getDoctorById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [doctor, patientCount] = await Promise.all([
    Doctor.findById(id).lean(),
    Patient.countDocuments({ doctorId: id }),
  ]);

  if (!doctor) {
    throw new AppError(404, "Doctor not found", { code: "DOCTOR_NOT_FOUND" });
  }

  return sendSuccess(res, 200, {
    doctor: {
      ...doctor,
      patientCount,
    },
  });
});

export const updateDoctor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as UpdateDoctorInput;

  const doctor = await Doctor.findByIdAndUpdate(id, payload, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

  if (!doctor) {
    throw new AppError(404, "Doctor not found", { code: "DOCTOR_NOT_FOUND" });
  }

  const patientCount = await Patient.countDocuments({ doctorId: id });

  return sendSuccess(
    res,
    200,
    {
      doctor: {
        ...doctor,
        patientCount,
      },
    },
    { message: "Doctor updated successfully" }
  );
});

export const deleteDoctor = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const reassignTo = req.query.reassignTo as string | undefined;

  const doctor = await Doctor.findById(id);
  if (!doctor) {
    throw new AppError(404, "Doctor not found", { code: "DOCTOR_NOT_FOUND" });
  }

  const assignedPatientsCount = await Patient.countDocuments({ doctorId: id });

  if (assignedPatientsCount > 0) {
    if (!reassignTo) {
      throw new AppError(
        409,
        `Cannot delete ${doctor.name} while ${assignedPatientsCount} patient(s) are assigned. Reassign patients to another doctor first.`,
        {
          code: "DOCTOR_HAS_PATIENTS",
          details: {
            assignedPatientsCount,
          },
        }
      );
    }

    if (reassignTo === id) {
      throw new AppError(400, "Target doctor for reassignment must be different from the doctor being deleted", {
        code: "INVALID_REASSIGNMENT",
      });
    }

    const targetDoctor = await Doctor.findById(reassignTo).lean();
    if (!targetDoctor) {
      throw new AppError(404, "Target doctor for reassignment not found", {
        code: "TARGET_DOCTOR_NOT_FOUND",
      });
    }

    await Patient.updateMany(
      { doctorId: new mongoose.Types.ObjectId(id) },
      { $set: { doctorId: new mongoose.Types.ObjectId(reassignTo) } }
    );
  }

  await Doctor.findByIdAndDelete(id);

  return sendSuccess(
    res,
    200,
    {
      deletedId: id,
      reassignedPatientsCount: assignedPatientsCount,
      reassignedTo: reassignTo ?? null,
    },
    {
      message:
        assignedPatientsCount > 0
          ? `Doctor deleted and ${assignedPatientsCount} patient(s) reassigned safely`
          : "Doctor deleted successfully",
    }
  );
});

export const getDoctorPatients = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const query = (res.locals.validatedQuery || req.query) as unknown as {
    search?: string;
    page: number;
    limit: number;
  };
  const { search, page, limit } = query;

  const doctorExists = await Doctor.exists({ _id: id });
  if (!doctorExists) {
    throw new AppError(404, "Doctor not found", { code: "DOCTOR_NOT_FOUND" });
  }

  const filter: Record<string, unknown> = {
    doctorId: id,
  };

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { condition: regex }];
  }

  const skip = (page - 1) * limit;

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("doctorId", "name specialization hospital")
      .lean(),
    Patient.countDocuments(filter),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return sendSuccess(
    res,
    200,
    { patients },
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
