import { Router } from "express";
import { teacherController } from "../controllers/teacher.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get("/", asyncHandler(teacherController.list));

export default router;
