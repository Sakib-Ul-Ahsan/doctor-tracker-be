import mongoose, { Document, Schema } from "mongoose";

export type ActivityType =
  | "doctor_created"
  | "doctor_updated"
  | "doctor_deleted"
  | "patient_created"
  | "patient_updated"
  | "patient_deleted"
  | "patient_reassigned";

export interface IActivity extends Document {
  type: ActivityType;
  description: string;
  entityId?: string;
  entityType: "doctor" | "patient";
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "doctor_created",
        "doctor_updated",
        "doctor_deleted",
        "patient_created",
        "patient_updated",
        "patient_deleted",
        "patient_reassigned",
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      required: false,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["doctor", "patient"],
    },
    meta: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);

