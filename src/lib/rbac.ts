import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireUser();
  if (session.user.role !== role) redirect("/unauthorized");
  return session;
}

export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}

export async function requireCandidate() {
  return requireRole(Role.CANDIDATE);
}
