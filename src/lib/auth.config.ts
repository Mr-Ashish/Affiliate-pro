import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma / Node-only modules).
 * Used by middleware; full providers live in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAdminRoute = pathname.startsWith("/admin");
      const isLoginPage =
        pathname === "/admin/login" || pathname.startsWith("/admin/login/");

      if (!isAdminRoute || isLoginPage) {
        return true;
      }

      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
