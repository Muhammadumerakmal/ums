import { Router } from "express";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import courseRoutes from "./course.routes";
import enrollmentRoutes from "./enrollment.routes";
import gradeRoutes from "./grade.routes";
import teacherRoutes from "./teacher.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/grades", gradeRoutes);
router.use("/teachers", teacherRoutes);

export default router;
