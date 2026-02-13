"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ChangePasswordGuard() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (
      session?.user &&
      (role === "trainer" || role === "player") &&
      !(session.user as any).hasPasswordChanged
    ) {
      router.push("/change-password");
    }
  }, [session, router]);

  return null;
}
