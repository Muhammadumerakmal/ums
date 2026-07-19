import type { Request, Response } from "express";
import { studentService } from "../services/student.service";
import { createStudentSchema, updateStudentSchema } from "../validation/student.schema";

export const studentController = {
  async list(_req: Request, res: Response) {
    res.json({ data: await studentService.list() });
  },

  async create(req: Request, res: Response) {
    const body = createStudentSchema.parse(req.body);
    res.status(201).json({ data: await studentService.create(body) });
  },

  async get(req: Request, res: Response) {
    res.json({ data: await studentService.getById(req.params.id) });
  },

  async update(req: Request, res: Response) {
    const body = updateStudentSchema.parse(req.body);
    res.json({ data: await studentService.update(req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    res.json({ data: await studentService.softDelete(req.params.id) });
  },
};
