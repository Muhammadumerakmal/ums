import bcrypt from "bcryptjs";

const rounds = Number(process.env.BCRYPT_ROUNDS ?? "10");

/** Hash a plaintext password. Never store plaintext. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
