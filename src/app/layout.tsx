import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Providers } from "@/app/providers";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Trening indywidualny piłki nożnej",
  description: "Baza zawodników, cele i treningi",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const playerId = (session?.user as { playerId?: string | null } | undefined)?.playerId;

  return (
    <html lang="pl">
      <body className="min-h-screen text-slate-900">
        <Providers>
          {session && (
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
              <div className="w-full px-4 md:px-6 lg:px-10">
                <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      Trening indywidualny
                    </Link>
                    <span className="hidden sm:inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-900">
                      {role === "admin" ? "Panel admina" : role === "player" ? "Panel zawodnika" : "Panel trenera"}
                    </span>
                  </div>

                  <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
                    {role === "player" ? (
                      <>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href={playerId ? `/players/${playerId}` : "/"}>
                          Moj profil
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/change-password">
                          Haslo
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/players">
                          Zawodnicy
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/trainings">
                          Treningi
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/skills">
                          Umiejetnosci
                        </Link>
                        {role === "admin" ? (
                          <>
                            <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/admin/trainers">
                              Trenerzy
                            </Link>
                            <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/admin/users">
                              Admin
                            </Link>
                          </>
                        ) : null}
                      </>
                    )}
                    <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/logout">
                      Wyloguj
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
          )}

          <main className="app-shell pb-24 md:pb-8">{children}</main>
          {session ? <MobileBottomNav role={role} /> : null}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
