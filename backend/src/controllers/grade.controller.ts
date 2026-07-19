import type { Request, Response } from "express";
import { gradeService } from "../services/grade.service";
import { teacherModel } from "../models/teacher.model";
import { studentModel } from "../models/student.model";
import { gradeSchema } from "../validation/grade.schema";
import { Forbidden } from "../lib/errors";

export const gradeController = {
  /** Owning teacher records/updates a grade. FR-016/017/018. */
  async setGrade(req: Request, res: Response) {
    const teacher = await teacherModel.findByUserId(req.user!.userId);
    if (!teacher) throw Forbidden("No teacher profile for this account.");
    const body = gradeSchema.parse(req.body);
    res.json({ data: await gradeService.setGrade(body.enrollmentId, body.letter, teacher.id) });
  },

  /** Student views their own grades. FR-019. */
  async myGrades(req: Request, res: Response) {
    const student = await studentModel.findByUserId(req.user!.userId);
    if (!student) throw Forbidden("No student profile for this account.");
    res.json({ data: await gradeService.listForStudent(student.id) });
  },
};
