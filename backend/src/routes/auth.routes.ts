import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/login", asyncHandler(authController.login));
router.post("/logout", authenticate, asyncHandler(authController.logout));
router.get("/me", authenticate, asyncHandler(authController.me));

export default router;
