import { Router } from "express";
import { enrollmentController } from "../controllers/enrollment.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate);

router.get("/", authorize("student"), asyncHandler(enrollmentController.list));
router.post("/", authorize("student"), asyncHandler(enrollmentController.enroll));
router.delete("/:id", authorize("student", "admin"), asyncHandler(enrollmentController.drop));

export default router;
