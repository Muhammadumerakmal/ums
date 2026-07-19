import type { Request, Response } from "express";
import { teacherModel } from "../models/teacher.model";

export const teacherController = {
  /** Admin lists teachers (used to assign a course owner). */
  async list(_req: Request, res: Response) {
    res.json({ data: await teacherModel.listAll() });
  },
};
