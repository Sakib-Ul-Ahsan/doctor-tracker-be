import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // Required behind Render/reverse proxies so secure cookies work properly
  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin: true, // Allow and reflect any origin to prevent CORS rejections
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
      exposedHeaders: ["Set-Cookie"],
    })
  );

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Root info and dedicated health check endpoints
  const healthHandler = (_req: express.Request, res: express.Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";

    res.status(200).json({
      success: true,
      data: {
        status: "ok",
        uptime: Math.round(process.uptime()),
        database: dbStatus,
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  };

  app.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Doctor Tracker API is online",
      docs: "/docs",
      health: "/health",
    });
  });
  app.get("/health", healthHandler);

  // OpenAPI schema JSON endpoints
  app.get("/docs.json", (_req, res) => res.status(200).json(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.status(200).json(swaggerSpec));

  // Interactive Swagger UI documentation
  const swaggerUiOptions = {
    customSiteTitle: "Doctor Tracker API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
    },
  };
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Mount routes under both /api and /api/v1 for backwards compatibility
  app.use("/api/v1", apiRoutes);
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

