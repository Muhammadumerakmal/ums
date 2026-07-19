import type { Request, Response } from "express";
import { askAssistant } from "../ai/agent";
import { studentModel } from "../models/student.model";
import { assistantSchema } from "../validation/assistant.schema";
import { Forbidden } from "../lib/errors";

export const assistantController = {
  /** A signed-in student asks the AI assistant a question. Scoped to their own data. */
  async chat(req: Request, res: Response) {
    const student = await studentModel.findByUserId(req.user!.userId);
    if (!student) throw Forbidden("No student profile for this account.");
    const { message } = assistantSchema.parse(req.body);
    const reply = await askAssistant(message, { studentId: student.id });
    res.json({ data: { reply } });
  },
};
