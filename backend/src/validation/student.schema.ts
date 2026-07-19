import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  studentNumber: z.string().min(1),
});

export const updateStudentSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    studentNumber: z.string().min(1).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
