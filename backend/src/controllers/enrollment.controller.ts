import type { Request, Response } from "express";
import { enrollmentService } from "../services/enrollment.service";
import { studentModel } from "../models/student.model";
import { enrollSchema } from "../validation/enrollment.schema";
import { Forbidden } from "../lib/errors";

export const enrollmentController = {
  /** A student lists their own active enrollments. FR-014. */
  async list(req: Request, res: Response) {
    const student = await requireStudent(req.user!.userId);
    res.json({ data: await enrollmentService.listForStudent(student.id) });
  },

  async enroll(req: Request, res: Response) {
    const student = await requireStudent(req.user!.userId);
    const body = enrollSchema.parse(req.body);
    res.status(201).json({ data: await enrollmentService.enroll(student.id, body.courseId) });
  },

  async drop(req: Request, res: Response) {
    const user = req.user!;
    const studentId = user.role === "student" ? (await requireStudent(user.userId)).id : null;
    res.json({ data: await enrollmentService.drop(req.params.id, { role: user.role, studentId }) });
  },
};

async function requireStudent(userId: string) {
  const student = await studentModel.findByUserId(userId);
  if (!student) throw Forbidden("No student profile for this account.");
  return student;
}
