import { describe, expect, it } from "vitest";
import { validateBangladeshiPhone, bdPhoneSchema, BD_PHONE_REGEX } from "../src/validators/phone.validator";
import { normalizeEmail, normalizePhone } from "../src/utils/contactUniqueness";

describe("Bangladeshi Phone Number Validation", () => {
  it("accepts valid 13-digit Bangladeshi mobile numbers in 8801XXXXXXXXX format", () => {
    const validNumbers = [
      "8801711234501", // GP (017)
      "8801311234501", // GP (013)
      "8801819345603", // Robi (018)
      "8801612100205", // Airtel (016)
      "8801911456704", // Banglalink (019)
      "8801411456704", // Banglalink (014)
      "8801512100205", // Teletalk (015)
    ];

    for (const num of validNumbers) {
      expect(BD_PHONE_REGEX.test(num)).toBe(true);
      expect(validateBangladeshiPhone(num).isValid).toBe(true);
      expect(() => bdPhoneSchema.parse(num)).not.toThrow();
    }
  });

  it("rejects phone numbers containing '+' or non-numeric characters", () => {
    const invalidNumbers = [
      "+8801711234501",
      "+880-1711-234501",
      "8801711-234501",
      "8801711 234501",
      "880171123450a",
      "880171123450#",
    ];

    for (const num of invalidNumbers) {
      const res = validateBangladeshiPhone(num);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/only numeric digits/i);
      expect(() => bdPhoneSchema.parse(num)).toThrow();
    }
  });

  it("rejects phone numbers that do not start with 880", () => {
    const invalidPrefixes = [
      "01711234501",
      "01811234501",
      "919876543210",
      "1234567890123",
      "8811711234501",
    ];

    for (const num of invalidPrefixes) {
      const res = validateBangladeshiPhone(num);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/start with country code 880/i);
      expect(() => bdPhoneSchema.parse(num)).toThrow();
    }
  });

  it("rejects phone numbers with incorrect lengths (must be exactly 13 digits)", () => {
    const wrongLengths = [
      "88017", // 5 digits
      "88017112345", // 11 digits
      "880171123450", // 12 digits
      "88017112345019", // 14 digits
      "8801711234501999", // 16 digits
    ];

    for (const num of wrongLengths) {
      const res = validateBangladeshiPhone(num);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/exactly 13 digits/i);
      expect(() => bdPhoneSchema.parse(num)).toThrow();
    }
  });

  it("rejects phone numbers without mobile prefix 8801", () => {
    const nonMobile = [
      "8802123456789", // Dhaka landline
      "8803123456789", // Chittagong landline
    ];

    for (const num of nonMobile) {
      const res = validateBangladeshiPhone(num);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/start with 8801/i);
      expect(() => bdPhoneSchema.parse(num)).toThrow();
    }
  });

  it("rejects phone numbers with invalid Bangladeshi mobile operator codes", () => {
    const invalidOperators = [
      "8801012345678", // 010 operator does not exist
      "8801112345678", // 011 Citycell defunct
      "8801212345678", // 012 operator does not exist
    ];

    for (const num of invalidOperators) {
      const res = validateBangladeshiPhone(num);
      expect(res.isValid).toBe(false);
      expect(res.message).toMatch(/valid Bangladeshi mobile operator code/i);
      expect(() => bdPhoneSchema.parse(num)).toThrow();
    }
  });
});

describe("Email and Phone Normalization Helpers", () => {
  it("normalizes emails to lowercase and trimmed string", () => {
    expect(normalizeEmail("  Doctor.Smith@Hospital.ORG  ")).toBe("doctor.smith@hospital.org");
    expect(normalizeEmail("PATIENT@Example.COM")).toBe("patient@example.com");
  });

  it("normalizes phone numbers by trimming whitespace", () => {
    expect(normalizePhone("  8801711234501  ")).toBe("8801711234501");
  });
});

