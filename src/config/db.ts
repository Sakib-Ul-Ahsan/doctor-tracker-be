import mongoose from "mongoose";
import { assertDatabaseUri } from "./env";

export async function connectDatabase(): Promise<void> {
  const uri = assertDatabaseUri();

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Connected to MongoDB");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

