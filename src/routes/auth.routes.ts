import { Router } from "express";
import { getMe, login, logout } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;

