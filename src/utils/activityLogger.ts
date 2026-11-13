import { Activity, ActivityType } from "../models/Activity";

export async function logActivity(
  type: ActivityType,
  description: string,
  entityType: "doctor" | "patient",
  entityId?: string,
  meta?: Record<string, any>
): Promise<void> {
  try {
    await Activity.create({
      type,
      description,
      entityType,
      entityId,
      meta,
    });
  } catch (error) {
    // Non-blocking log failure
    console.error("Failed to log activity event:", error);
  }
}

