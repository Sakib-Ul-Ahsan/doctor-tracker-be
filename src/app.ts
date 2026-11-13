import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env, getAllowedOrigins } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // Required behind Render/reverse proxies so secure cookies work properly
  app.set("trust proxy", 1);

  const allowedOrigins = getAllowedOrigins();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/+$/, "");
        const isExplicitlyAllowed = allowedOrigins.some(
          (allowed) => allowed.replace(/\/+$/, "") === normalizedOrigin
        );

        // Allow any vercel deployment for doctor-tracker-fe (e.g. doctor-tracker-fe-seven.vercel.app)
        const isVercelPreview = /^https:\/\/doctor-tracker-fe(-[a-z0-9-]+)?\.vercel\.app$/i.test(
          normalizedOrigin
        );
        const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin);

        if (isExplicitlyAllowed || isVercelPreview || isLocalhost) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount routes under both /api and /api/v1 for backwards compatibility
  app.use("/api/v1", apiRoutes);
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

