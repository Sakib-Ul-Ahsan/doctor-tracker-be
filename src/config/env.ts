import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required").optional(),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long")
    .default("test_jwt_secret_for_automated_tests_only"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  ADMIN_NAME: z.string().default("System Administrator"),
  ADMIN_EMAIL: z.string().email().default("admin@doctortracker.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export function getAllowedOrigins(): string[] {
  return env.CLIENT_URL.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function assertDatabaseUri(): string {
  const uri = env.MONGODB_URI;
  if (!uri || uri.includes("<username>") || uri.includes("<password>") || uri.includes("<cluster-url>")) {
    throw new Error(
      "MONGODB_URI is not configured with real credentials. Update backend/.env with your MongoDB Atlas connection string (or local MongoDB URI)."
    );
  }
  return uri;
}

