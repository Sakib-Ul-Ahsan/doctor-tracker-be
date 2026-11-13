import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env";

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly errors?: ErrorDetail[];

  constructor(
    statusCode: number,
    message: string,
    options?: {
      code?: string;
      details?: Record<string, unknown>;
      errors?: ErrorDetail[];
    }
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options?.code ?? "APP_ERROR";
    this.details = options?.details;
    this.errors = options?.errors;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, { code: "NOT_FOUND" }));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors: ErrorDetail[] = err.issues.map((issue) => ({
      field: issue.path.join(".") || undefined,
      message: issue.message,
    }));
    res.status(400).json({
      success: false,
      message: errors[0]?.message || "Validation failed",
      code: "VALIDATION_ERROR",
      errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      code: "INVALID_ID",
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: ErrorDetail[] = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: errors[0]?.message || "Database validation failed",
      code: "VALIDATION_ERROR",
      errors,
    });
    return;
  }

  const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
  if (mongoErr && mongoErr.code === 11000) {
    const duplicateField = mongoErr.keyPattern
      ? Object.keys(mongoErr.keyPattern)[0]
      : "field";
    res.status(409).json({
      success: false,
      message: `A record with this ${duplicateField} already exists`,
      code: "DUPLICATE_RESOURCE",
      errors: [{ field: duplicateField, message: `${duplicateField} is already in use` }],
    });
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error("Unhandled server error:", err);
  }

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "An unexpected internal server error occurred"
        : err instanceof Error
          ? err.message
          : "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

