import { Router } from "express";
import { assistantController } from "../controllers/assistant.controller";
import { asyncHandler } from "../lib/async-handler";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// Student-only assistant. Tools run scoped to the caller's student id.
router.use(authenticate, authorize("student"));
router.post("/", asyncHandler(assistantController.chat));

export default router;
