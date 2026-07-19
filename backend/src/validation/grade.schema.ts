import { z } from "zod";

export const gradeSchema = z.object({
  enrollmentId: z.string().uuid(),
  letter: z.enum(["A", "B", "C", "D", "F"]),
});

export type GradeInput = z.infer<typeof gradeSchema>;
