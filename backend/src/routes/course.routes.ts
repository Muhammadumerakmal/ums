import { Router } from "express";
import { courseController } from "../controllers/course.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin", "teacher", "student"), asyncHandler(courseController.list));
router.post("/", authorize("admin"), asyncHandler(courseController.create));
router.get("/:id", authorize("admin", "teacher", "student"), asyncHandler(courseController.get));
router.patch("/:id", authorize("admin"), asyncHandler(courseController.update));
router.delete("/:id", authorize("admin"), asyncHandler(courseController.remove));
router.get("/:id/roster", authorize("admin", "teacher"), asyncHandler(courseController.roster));

export default router;
