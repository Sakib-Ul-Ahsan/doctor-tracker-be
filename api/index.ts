import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/db";

// Connect to MongoDB
connectDatabase().catch((err) => {
  console.error("Database connection error in Vercel function:", err);
});

const app = createApp();

export default app;

