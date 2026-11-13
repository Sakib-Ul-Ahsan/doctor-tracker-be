import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDoctor {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctorDocument extends IDoctor, Document {}

const doctorSchema = new Schema<IDoctorDocument>(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      minlength: [2, "Doctor name must be at least 2 characters"],
      maxlength: [120, "Doctor name cannot exceed 120 characters"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      minlength: [2, "Specialization must be at least 2 characters"],
      maxlength: [100, "Specialization cannot exceed 100 characters"],
    },
    hospital: {
      type: String,
      required: [true, "Hospital is required"],
      trim: true,
      minlength: [2, "Hospital name must be at least 2 characters"],
      maxlength: [150, "Hospital name cannot exceed 150 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      maxlength: [30, "Phone number cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ name: 1 });
doctorSchema.index({ createdAt: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1 });

export const Doctor: Model<IDoctorDocument> =
  mongoose.models.Doctor || mongoose.model<IDoctorDocument>("Doctor", doctorSchema);

