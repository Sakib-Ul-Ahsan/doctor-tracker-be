import { Router } from "express";
import authRoutes from "./auth.routes";
import doctorRoutes from "./doctor.routes";
import patientRoutes from "./patient.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/doctors", doctorRoutes);
router.use("/patients", patientRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

