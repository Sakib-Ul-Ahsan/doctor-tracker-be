import { z } from "zod";
import mongoose from "mongoose";
import { PATIENT_GENDERS } from "../models/Patient";

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid identifier format",
  });

export const patientIdParamSchema = z.object({
  id: objectIdSchema,
});

export const createPatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Patient name must be at least 2 characters")
    .max(120, "Patient name cannot exceed 120 characters"),
  age: z.coerce
    .number()
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(150, "Age cannot exceed 150"),
  gender: z.enum(PATIENT_GENDERS, {
    error: "Gender must be Male, Female, or Other",
  }),
  phone: z
    .string()
    .trim()
    .min(5, "Phone number must be at least 5 characters")
    .max(30, "Phone number cannot exceed 30 characters"),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  condition: z
    .string()
    .trim()
    .min(2, "Medical condition must be at least 2 characters")
    .max(150, "Medical condition cannot exceed 150 characters"),
  doctorId: objectIdSchema,
});

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const listPatientsQuerySchema = z.object({
  search: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  doctorId: objectIdSchema.optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
  sortBy: z.enum(["createdAt", "name", "age", "condition"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;

