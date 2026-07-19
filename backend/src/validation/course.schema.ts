import { z } from "zod";

export const createCourseSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  teacherId: z.string().uuid(),
});

export const updateCourseSchema = z
  .object({
    code: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    teacherId: z.string().uuid().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
