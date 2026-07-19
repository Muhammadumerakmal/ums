import { z } from "zod";

export const enrollSchema = z.object({
  courseId: z.string().uuid(),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
