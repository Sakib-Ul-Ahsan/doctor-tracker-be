import { Router } from "express";
import {
  bulkDeleteDoctors,
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctorPatients,
  getDoctors,
  updateDoctor,
} from "../controllers/doctor.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createDoctorSchema,
  deleteDoctorQuerySchema,
  doctorPatientsQuerySchema,
  idParamSchema,
  listDoctorsQuerySchema,
  updateDoctorSchema,
} from "../validators/doctor.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listDoctorsQuerySchema }), getDoctors);
router.post("/", validate({ body: createDoctorSchema }), createDoctor);
router.post("/bulk-delete", bulkDeleteDoctors);
router.get("/:id", validate({ params: idParamSchema }), getDoctorById);
router.patch("/:id", validate({ params: idParamSchema, body: updateDoctorSchema }), updateDoctor);
router.delete(
  "/:id",
  validate({ params: idParamSchema, query: deleteDoctorQuerySchema }),
  deleteDoctor
);
router.get(
  "/:id/patients",
  validate({ params: idParamSchema, query: doctorPatientsQuerySchema }),
  getDoctorPatients
);

export default router;
