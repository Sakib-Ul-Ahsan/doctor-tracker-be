import jwt, { SignOptions } from "jsonwebtoken";
import { CookieOptions } from "express";
import { env } from "../config/env";

export const AUTH_COOKIE_NAME = "dt_auth_token";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: "admin";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

export function getAuthCookieOptions(): CookieOptions {
  // Always use SameSite=None and Secure for cross-origin hosting (Vercel/Render)
  const isLocalhost = env.CLIENT_URL.includes("localhost") && env.NODE_ENV === "development";
  return {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: isLocalhost ? "lax" : "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export function getClearCookieOptions(): CookieOptions {
  const isLocalhost = env.CLIENT_URL.includes("localhost") && env.NODE_ENV === "development";
  return {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: isLocalhost ? "lax" : "none",
    path: "/",
  };
}

