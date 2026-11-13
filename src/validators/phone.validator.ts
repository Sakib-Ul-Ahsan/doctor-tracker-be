import { z } from "zod";

export const BD_PHONE_REGEX = /^8801[3-9]\d{8}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateBangladeshiPhone(phone: unknown): PhoneValidationResult {
  if (typeof phone !== "string") {
    return { isValid: false, message: "Phone number is required" };
  }

  const trimmed = phone.trim();

  if (!trimmed) {
    return { isValid: false, message: "Phone number is required" };
  }

  // Reject non-numeric characters (e.g. '+', '-', spaces, letters)
  if (!/^\d+$/.test(trimmed)) {
    return {
      isValid: false,
      message: "Phone number must contain only numeric digits (no '+' or special characters)",
    };
  }

  // Reject numbers that do not start with 880
  if (!trimmed.startsWith("880")) {
    return {
      isValid: false,
      message: "Phone number must start with country code 880 (format: 8801XXXXXXXXX)",
    };
  }

  // Reject numbers that do not start with 8801
  if (!trimmed.startsWith("8801")) {
    return {
      isValid: false,
      message: "Phone number must start with 8801 for Bangladeshi mobile numbers",
    };
  }

  // Reject numbers with incorrect lengths (must be exactly 13 digits)
  if (trimmed.length !== 13) {
    return {
      isValid: false,
      message: `Phone number must contain exactly 13 digits (received ${trimmed.length} digits)`,
    };
  }

  // Reject invalid mobile operator codes (must be 88013 through 88019)
  if (!BD_PHONE_REGEX.test(trimmed)) {
    return {
      isValid: false,
      message: "Phone number must have a valid Bangladeshi mobile operator code (88013 - 88019)",
    };
  }

  return { isValid: true };
}

export const bdPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .superRefine((val, ctx) => {
    const result = validateBangladeshiPhone(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.message || "Invalid Bangladeshi phone number in 8801XXXXXXXXX format",
      });
    }
  });
