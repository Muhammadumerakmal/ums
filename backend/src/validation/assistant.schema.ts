import { z } from "zod";

export const assistantSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
});

export type AssistantInput = z.infer<typeof assistantSchema>;
