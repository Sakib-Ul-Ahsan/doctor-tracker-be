import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { syncContactRegistry } from "./utils/contactUniqueness";

async function startServer() {
  await connectDatabase();
  await syncContactRegistry().catch((err) => {
    console.warn("Contact registry sync notice:", err.message);
  });

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Doctor Tracker API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

