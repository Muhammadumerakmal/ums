import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// All student management is admin-only. Deny-by-default via authorize.
router.use(authenticate, authorize("admin"));

router.get("/", asyncHandler(studentController.list));
router.post("/", asyncHandler(studentController.create));
router.get("/:id", asyncHandler(studentController.get));
router.patch("/:id", asyncHandler(studentController.update));
router.delete("/:id", asyncHandler(studentController.remove));

export default router;
