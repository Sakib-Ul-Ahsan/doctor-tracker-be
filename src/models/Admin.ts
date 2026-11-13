import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IAdmin {
  name: string;
  email: string;
  password: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminDocument extends IAdmin, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdminDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

adminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin: Model<IAdminDocument> =
  mongoose.models.Admin || mongoose.model<IAdminDocument>("Admin", adminSchema);

