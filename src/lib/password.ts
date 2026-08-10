import { compare, hash } from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password with bcrypt (cost factor 12).
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}
