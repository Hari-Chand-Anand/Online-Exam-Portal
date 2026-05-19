import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function resolveRole(email: string) {
  if (adminEmails().includes(email.toLowerCase())) return Role.ADMIN;
  const candidate = await prisma.candidate.findUnique({ where: { email: email.toLowerCase() } });
  return candidate?.status === "ACTIVE" ? Role.CANDIDATE : null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/unauthorized"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return "/unauthorized?reason=no-email";
      const role = await resolveRole(email);
      if (!role) return "/unauthorized?reason=not-invited";
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email || token.email) {
        const email = (user?.email || token.email)!.toLowerCase();
        const role = await resolveRole(email);
        token.role = role || Role.CANDIDATE;
        const dbUser = await prisma.user.findUnique({ where: { email } });
        token.id = dbUser?.id || user?.id || token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || token.sub || "");
        session.user.role = (token.role as Role) || Role.CANDIDATE;
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return;
      const role = await resolveRole(email);
      const dbUser = await prisma.user.update({
        where: { email },
        data: { role: role || Role.CANDIDATE, lastLoginAt: new Date(), name: user.name, image: user.image }
      });
      const candidate = await prisma.candidate.findUnique({ where: { email } });
      if (candidate && !candidate.userId) {
        await prisma.candidate.update({ where: { id: candidate.id }, data: { userId: dbUser.id } });
      }
    }
  }
});
