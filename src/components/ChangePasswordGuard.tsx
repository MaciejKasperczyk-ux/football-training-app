"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ChangePasswordGuard() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = (session?.user as { role?: string; hasPasswordChanged?: boolean } | undefined)?.role;
    const hasPasswordChanged = (session?.user as { hasPasswordChanged?: boolean } | undefined)?.hasPasswordChanged;
    if (!session?.user || !role) return;

    if ((role === "trainer" || role === "club_trainer" || role === "player") && !hasPasswordChanged) {
      if (pathname !== "/change-password") router.push("/change-password");
      return;
    }

    if (role !== "player" || pathname === "/change-password" || pathname.endsWith("/disc") || pathname === "/logout") return;

    let cancelled = false;
    fetch("/api/me/disc-status", { cache: "no-store" })
      .then((res) => res.json().catch(() => null))
      .then((data) => {
        if (cancelled) return;
        if (data?.mustFill && data?.playerId) {
          router.push(`/players/${String(data.playerId)}/disc`);
        }
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [session, router, pathname]);

  return null;
}
