"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "admin" | "trainer" | "viewer" | string;

function itemClass(active: boolean) {
  return active
    ? "flex min-w-0 flex-1 flex-col items-center rounded-lg bg-slate-900 px-2 py-2 text-[11px] font-semibold text-white"
    : "flex min-w-0 flex-1 flex-col items-center rounded-lg px-2 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100";
}

export default function MobileBottomNav({ role }: { role?: Role }) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  if (role === "player") {
    return (
      <div className="mobile-bottom-nav md:hidden">
        <div className="mobile-bottom-nav-inner">
          <Link href="/" className={itemClass(pathname === "/")}>
            Start
          </Link>
          <Link href="/players" className={itemClass(isActive("/players"))}>
            Profil
          </Link>
          <Link href="/change-password" className={itemClass(isActive("/change-password"))}>
            Haslo
          </Link>
          <Link href="/logout" className={itemClass(isActive("/logout"))}>
            Wyloguj
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-bottom-nav md:hidden">
      <div className="mobile-bottom-nav-inner">
        <Link href="/" className={itemClass(pathname === "/")}>
          Start
        </Link>
        <Link href="/players" className={itemClass(isActive("/players"))}>
          Zawodnicy
        </Link>
        <Link href="/trainings" className={itemClass(isActive("/trainings"))}>
          Treningi
        </Link>
        <Link href="/skills" className={itemClass(isActive("/skills"))}>
          Umiejetnosci
        </Link>
        {role === "admin" ? (
          <Link href="/admin/trainers" className={itemClass(isActive("/admin"))}>
            Admin
          </Link>
        ) : (
          <Link href="/logout" className={itemClass(isActive("/logout"))}>
            Wyloguj
          </Link>
        )}
      </div>
    </div>
  );
}
