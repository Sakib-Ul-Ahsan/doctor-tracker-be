import { Router } from "express";
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
} from "../controllers/patient.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createPatientSchema,
  listPatientsQuerySchema,
  patientIdParamSchema,
  updatePatientSchema,
} from "../validators/patient.validator";

const router = Router();

router.use(authenticate);

router.get("/", validate({ query: listPatientsQuerySchema }), getPatients);
router.post("/", validate({ body: createPatientSchema }), createPatient);
router.get("/:id", validate({ params: patientIdParamSchema }), getPatientById);
router.patch(
  "/:id",
  validate({ params: patientIdParamSchema, body: updatePatientSchema }),
  updatePatient
);
router.delete("/:id", validate({ params: patientIdParamSchema }), deletePatient);

export default router;

