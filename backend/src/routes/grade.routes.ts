import { Router } from "express";
import { gradeController } from "../controllers/grade.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate);

router.get("/", authorize("student"), asyncHandler(gradeController.myGrades));
router.post("/", authorize("teacher"), asyncHandler(gradeController.setGrade));

export default router;
