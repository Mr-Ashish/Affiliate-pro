import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
};

/**
 * Validate admin credentials against AdminUser.password_hash.
 * Returns null on missing user or bad password (no user enumeration).
 */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthenticatedAdmin | null> {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !password) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: normalized },
  });
  if (!admin) {
    return null;
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
  };
}
