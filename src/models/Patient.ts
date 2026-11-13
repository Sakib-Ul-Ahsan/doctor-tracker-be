import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const PATIENT_GENDERS = ["Male", "Female", "Other"] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export interface IPatient {
  name: string;
  age: number;
  gender: PatientGender;
  phone: string;
  email: string;
  condition: string;
  doctorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientDocument extends IPatient, Document {}

const patientSchema = new Schema<IPatientDocument>(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      minlength: [2, "Patient name must be at least 2 characters"],
      maxlength: [120, "Patient name cannot exceed 120 characters"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
      max: [150, "Age cannot exceed 150"],
    },
    gender: {
      type: String,
      enum: {
        values: PATIENT_GENDERS,
        message: "Gender must be Male, Female, or Other",
      },
      required: [true, "Gender is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^8801[3-9]\d{8}$/.test(v);
        },
        message: "Phone number must be a valid 13-digit Bangladeshi number in 8801XXXXXXXXX format",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    condition: {
      type: String,
      required: [true, "Medical condition is required"],
      trim: true,
      minlength: [2, "Medical condition must be at least 2 characters"],
      maxlength: [150, "Medical condition cannot exceed 150 characters"],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Assigned doctor is required"],
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ email: 1 }, { unique: true });
patientSchema.index({ phone: 1 }, { unique: true });
patientSchema.index({ doctorId: 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ condition: 1 });
patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ name: 1 });
patientSchema.index({ email: 1 });

export const Patient: Model<IPatientDocument> =
  mongoose.models.Patient || mongoose.model<IPatientDocument>("Patient", patientSchema);

