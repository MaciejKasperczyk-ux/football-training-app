"use client";

import { SessionProvider } from "next-auth/react";
import { ChangePasswordGuard } from "@/components/ChangePasswordGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChangePasswordGuard />
      {children}
    </SessionProvider>
  );
}
