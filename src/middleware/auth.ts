import { NextFunction, Request, Response } from "express";
import { Admin } from "../models/Admin";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token || typeof token !== "string") {
      throw new AppError(401, "Authentication required. Please sign in.", {
        code: "UNAUTHORIZED",
      });
    }

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch {
      throw new AppError(401, "Session expired or invalid. Please sign in again.", {
        code: "INVALID_SESSION",
      });
    }

    const admin = await Admin.findById(decoded.sub).select("name email role").lean();
    if (!admin) {
      throw new AppError(401, "Account no longer exists. Please sign in again.", {
        code: "UNAUTHORIZED",
      });
    }

    if (admin.role !== "admin") {
      throw new AppError(403, "Forbidden: Admin privileges required.", {
        code: "FORBIDDEN",
      });
    }

    req.admin = {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

