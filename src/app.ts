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
        if (allowedOrigins.includes(origin)) {
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

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

