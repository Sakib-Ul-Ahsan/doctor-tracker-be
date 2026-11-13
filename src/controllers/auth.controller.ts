import { Request, Response } from "express";
import { Admin } from "../models/Admin";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getClearCookieOptions,
  signAuthToken,
} from "../utils/jwt";
import { LoginInput } from "../validators/auth.validator";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    throw new AppError(401, "Invalid email or password", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password", {
      code: "INVALID_CREDENTIALS",
    });
  }

  const token = signAuthToken({
    sub: String(admin._id),
    email: admin.email,
    role: admin.role,
  });

  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

  return sendSuccess(
    res,
    200,
    {
      admin: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    },
    { message: "Signed in successfully" }
  );
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());

  return sendSuccess(res, 200, { loggedOut: true }, { message: "Signed out successfully" });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, 200, {
    admin: req.admin,
  });
});

