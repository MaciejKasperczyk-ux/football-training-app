// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export type AppRole = "admin" | "trainer" | "viewer";

export async function getSessionOrNull() {
  return getServerSession(authOptions);
}

export async function requireRoleApi(roles: AppRole[]) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as AppRole | undefined;

  if (!session?.user) {
    return { ok: false as const, status: 401 as const, session: null };
  }

  if (!role || !roles.includes(role)) {
    return { ok: false as const, status: 403 as const, session };
  }

  return { ok: true as const, status: 200 as const, session };
}
