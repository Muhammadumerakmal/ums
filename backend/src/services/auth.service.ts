import { userModel } from "../models/user.model";
import { studentModel } from "../models/student.model";
import { teacherModel } from "../models/teacher.model";
import { verifyPassword } from "../lib/password";
import { signToken } from "../lib/jwt";
import { Unauthenticated } from "../lib/errors";
import type { Role } from "../models/schema";

export interface AuthenticatedIdentity {
  token: string;
  user: { id: string; fullName: string; role: Role; profileId: string | null };
}

export const authService = {
  /** Verify credentials and issue a signed token. FR-001. */
  async login(email: string, password: string): Promise<AuthenticatedIdentity> {
    const user = await userModel.findByEmail(email);
    if (!user) throw Unauthenticated("Invalid email or password.");

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw Unauthenticated("Invalid email or password.");

    const token = signToken({ sub: user.id, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        profileId: await resolveProfileId(user.id, user.role),
      },
    };
  },

  /** Resolve the full identity for the current user id (used by /me). */
  async me(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) throw Unauthenticated();
    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      profileId: await resolveProfileId(user.id, user.role),
    };
  },
};

/** The student/teacher profile id for a user, or null for admins. */
async function resolveProfileId(userId: string, role: Role): Promise<string | null> {
  if (role === "student") return (await studentModel.findByUserId(userId))?.id ?? null;
  if (role === "teacher") return (await teacherModel.findByUserId(userId))?.id ?? null;
  return null;
}
