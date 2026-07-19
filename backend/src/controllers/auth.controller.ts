import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { loginSchema } from "../validation/auth.schema";
import { COOKIE_NAME } from "../lib/jwt";

const cookieMaxAge = 60 * 60 * 1000; // 1h in ms, aligns with JWT_EXPIRES_IN default

export const authController = {
  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);
    const { token, user } = await authService.login(body.email, body.password);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge,
    });
    res.status(200).json({ data: user });
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ data: { ok: true } });
  },

  async me(req: Request, res: Response) {
    const identity = await authService.me(req.user!.userId);
    res.json({ data: identity });
  },
};
