import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IContactRegistry {
  type: "email" | "phone";
  value: string;
  ownerId: Types.ObjectId;
  ownerModel: "Doctor" | "Patient";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactRegistryDocument extends IContactRegistry, Document {}

const contactRegistrySchema = new Schema<IContactRegistryDocument>(
  {
    type: {
      type: String,
      enum: ["email", "phone"],
      required: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "ownerModel",
    },
    ownerModel: {
      type: String,
      enum: ["Doctor", "Patient"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring that across both Doctors and Patients,
// no duplicate email and no duplicate phone number can exist in the database.
contactRegistrySchema.index({ type: 1, value: 1 }, { unique: true });
contactRegistrySchema.index({ ownerId: 1, type: 1 });

export const ContactRegistry: Model<IContactRegistryDocument> =
  mongoose.models.ContactRegistry ||
  mongoose.model<IContactRegistryDocument>("ContactRegistry", contactRegistrySchema);
