import { z } from "zod";
import mongoose from "mongoose";
import { bdPhoneSchema } from "./phone.validator";

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid identifier format",
  });

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const createDoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Doctor name must be at least 2 characters")
    .max(120, "Doctor name cannot exceed 120 characters"),
  specialization: z
    .string()
    .trim()
    .min(2, "Specialization must be at least 2 characters")
    .max(100, "Specialization cannot exceed 100 characters"),
  hospital: z
    .string()
    .trim()
    .min(2, "Hospital name must be at least 2 characters")
    .max(150, "Hospital name cannot exceed 150 characters"),
  phone: bdPhoneSchema,
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

export const updateDoctorSchema = createDoctorSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const listDoctorsQuerySchema = z.object({
  search: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
  sortBy: z.enum(["createdAt", "name", "specialization", "hospital"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const deleteDoctorQuerySchema = z.object({
  reassignTo: objectIdSchema.optional(),
});

export const doctorPatientsQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;

