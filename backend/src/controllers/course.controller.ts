import type { Request, Response } from "express";
import { courseService } from "../services/course.service";
import { teacherModel } from "../models/teacher.model";
import { createCourseSchema, updateCourseSchema } from "../validation/course.schema";

export const courseController = {
  async list(_req: Request, res: Response) {
    res.json({ data: await courseService.list() });
  },

  async create(req: Request, res: Response) {
    const body = createCourseSchema.parse(req.body);
    res.status(201).json({ data: await courseService.create(body) });
  },

  async get(req: Request, res: Response) {
    res.json({ data: await courseService.getById(req.params.id) });
  },

  async update(req: Request, res: Response) {
    const body = updateCourseSchema.parse(req.body);
    res.json({ data: await courseService.update(req.params.id, body) });
  },

  async remove(req: Request, res: Response) {
    res.json({ data: await courseService.softDelete(req.params.id) });
  },

  async roster(req: Request, res: Response) {
    const user = req.user!;
    const teacherId =
      user.role === "teacher" ? (await teacherModel.findByUserId(user.userId))?.id ?? null : null;
    res.json({ data: await courseService.getRoster(req.params.id, user, teacherId) });
  },
};
