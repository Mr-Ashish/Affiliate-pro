import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Protect /admin/* (except login) using JWT session from Auth.js.
 * Next.js 16: `proxy` replaces deprecated `middleware` convention.
 * Edge-safe config only (no Prisma) — full Credentials provider is in auth.ts.
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Match /admin and all nested paths
  matcher: ["/admin", "/admin/:path*"],
};
