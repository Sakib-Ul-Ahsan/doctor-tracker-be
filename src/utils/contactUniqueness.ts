import mongoose, { Types } from "mongoose";
import { Doctor } from "../models/Doctor";
import { Patient } from "../models/Patient";
import { ContactRegistry } from "../models/ContactRegistry";
import { AppError } from "../middleware/errorHandler";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.trim();
}

export interface AssertContactUniquenessOptions {
  email?: string;
  phone?: string;
  excludeId?: string | Types.ObjectId;
  excludeModel?: "Doctor" | "Patient";
}

/**
 * Checks if the given email or phone number is already registered across Doctors or Patients.
 * Throws AppError with status 409 (Conflict) if a duplicate is found.
 */
export async function assertContactUniqueness(
  options: AssertContactUniquenessOptions
): Promise<void> {
  const email = options.email ? normalizeEmail(options.email) : undefined;
  const phone = options.phone ? normalizePhone(options.phone) : undefined;

  if (!email && !phone) return;

  const excludeObjId = options.excludeId
    ? new mongoose.Types.ObjectId(String(options.excludeId))
    : undefined;

  // 1. Check Doctors
  const doctorMatchCriteria: Record<string, unknown>[] = [];
  if (email) doctorMatchCriteria.push({ email });
  if (phone) doctorMatchCriteria.push({ phone });

  const doctorQuery: Record<string, unknown> = {
    $or: doctorMatchCriteria,
  };
  if (excludeObjId && options.excludeModel === "Doctor") {
    doctorQuery._id = { $ne: excludeObjId };
  }

  const conflictingDoctor = await Doctor.findOne(doctorQuery).lean();
  if (conflictingDoctor) {
    if (email && conflictingDoctor.email.toLowerCase() === email) {
      throw new AppError(409, `Email '${email}' is already registered to a doctor`, {
        code: "DUPLICATE_EMAIL",
        errors: [{ field: "email", message: `Email '${email}' is already registered to a doctor` }],
      });
    }
    if (phone && conflictingDoctor.phone === phone) {
      throw new AppError(409, `Phone number '${phone}' is already registered to a doctor`, {
        code: "DUPLICATE_PHONE",
        errors: [{ field: "phone", message: `Phone number '${phone}' is already registered to a doctor` }],
      });
    }
  }

  // 2. Check Patients
  const patientMatchCriteria: Record<string, unknown>[] = [];
  if (email) patientMatchCriteria.push({ email });
  if (phone) patientMatchCriteria.push({ phone });

  const patientQuery: Record<string, unknown> = {
    $or: patientMatchCriteria,
  };
  if (excludeObjId && options.excludeModel === "Patient") {
    patientQuery._id = { $ne: excludeObjId };
  }

  const conflictingPatient = await Patient.findOne(patientQuery).lean();
  if (conflictingPatient) {
    if (email && conflictingPatient.email.toLowerCase() === email) {
      throw new AppError(409, `Email '${email}' is already registered to a patient`, {
        code: "DUPLICATE_EMAIL",
        errors: [{ field: "email", message: `Email '${email}' is already registered to a patient` }],
      });
    }
    if (phone && conflictingPatient.phone === phone) {
      throw new AppError(409, `Phone number '${phone}' is already registered to a patient`, {
        code: "DUPLICATE_PHONE",
        errors: [{ field: "phone", message: `Phone number '${phone}' is already registered to a patient` }],
      });
    }
  }
}

/**
 * Registers email and phone in ContactRegistry for database-level unique constraint.
 */
export async function registerContacts(
  ownerId: string | Types.ObjectId,
  ownerModel: "Doctor" | "Patient",
  email: string,
  phone: string
): Promise<void> {
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePhone(phone);
  const ownerObjId = new mongoose.Types.ObjectId(String(ownerId));

  try {
    await ContactRegistry.insertMany([
      {
        type: "email",
        value: normEmail,
        ownerId: ownerObjId,
        ownerModel,
      },
      {
        type: "phone",
        value: normPhone,
        ownerId: ownerObjId,
        ownerModel,
      },
    ]);
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoErr && mongoErr.code === 11000) {
      throw new AppError(409, "Contact details (email or phone) are already registered", {
        code: "DUPLICATE_CONTACT",
      });
    }
    throw err;
  }
}

/**
 * Updates email and/or phone in ContactRegistry for an existing owner.
 */
export async function updateContacts(
  ownerId: string | Types.ObjectId,
  ownerModel: "Doctor" | "Patient",
  email?: string,
  phone?: string
): Promise<void> {
  const ownerObjId = new mongoose.Types.ObjectId(String(ownerId));

  if (email) {
    const normEmail = normalizeEmail(email);
    await ContactRegistry.findOneAndUpdate(
      { ownerId: ownerObjId, type: "email" },
      { $set: { value: normEmail, ownerModel } },
      { upsert: true }
    );
  }

  if (phone) {
    const normPhone = normalizePhone(phone);
    await ContactRegistry.findOneAndUpdate(
      { ownerId: ownerObjId, type: "phone" },
      { $set: { value: normPhone, ownerModel } },
      { upsert: true }
    );
  }
}

/**
 * Removes registered contacts when an owner (or owners) are deleted.
 */
export async function deleteContacts(
  ownerIds: Array<string | Types.ObjectId>
): Promise<void> {
  if (ownerIds.length === 0) return;
  const objectIds = ownerIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  await ContactRegistry.deleteMany({ ownerId: { $in: objectIds } });
}

/**
 * Backfills any missing Doctor/Patient contacts into ContactRegistry.
 */
export async function syncContactRegistry(): Promise<void> {
  const [doctors, patients] = await Promise.all([
    Doctor.find({}, { _id: 1, email: 1, phone: 1 }).lean(),
    Patient.find({}, { _id: 1, email: 1, phone: 1 }).lean(),
  ]);

  const operations: Array<{
    updateOne: {
      filter: { ownerId: Types.ObjectId; type: "email" | "phone" };
      update: { $set: { value: string; ownerModel: "Doctor" | "Patient" } };
      upsert: boolean;
    };
  }> = [];

  for (const doc of doctors) {
    if (doc.email) {
      operations.push({
        updateOne: {
          filter: { ownerId: doc._id, type: "email" as const },
          update: {
            $set: {
              value: normalizeEmail(doc.email),
              ownerModel: "Doctor" as const,
            },
          },
          upsert: true,
        },
      });
    }
    if (doc.phone) {
      operations.push({
        updateOne: {
          filter: { ownerId: doc._id, type: "phone" as const },
          update: {
            $set: {
              value: normalizePhone(doc.phone),
              ownerModel: "Doctor" as const,
            },
          },
          upsert: true,
        },
      });
    }
  }

  for (const pat of patients) {
    if (pat.email) {
      operations.push({
        updateOne: {
          filter: { ownerId: pat._id, type: "email" as const },
          update: {
            $set: {
              value: normalizeEmail(pat.email),
              ownerModel: "Patient" as const,
            },
          },
          upsert: true,
        },
      });
    }
    if (pat.phone) {
      operations.push({
        updateOne: {
          filter: { ownerId: pat._id, type: "phone" as const },
          update: {
            $set: {
              value: normalizePhone(pat.phone),
              ownerModel: "Patient" as const,
            },
          },
          upsert: true,
        },
      });
    }
  }

  if (operations.length > 0) {
    try {
      await ContactRegistry.bulkWrite(operations, { ordered: false });
    } catch {
      // Ignore duplicate key warnings on existing backfills
    }
  }
}
