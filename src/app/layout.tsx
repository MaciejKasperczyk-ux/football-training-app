import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
                    <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                      <Image src="/logo.png" alt="Logo Futbolucja" width={56} height={56} className="h-14 w-14 object-contain" priority />
                    </Link>
                    <span className="hidden sm:inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-900">
                      {role === "admin" ? "Panel admina" : role === "player" ? "Panel zawodnika" : "Panel trenera"}
                    </span>
                  </div>

                  <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
                    {role === "player" ? (
                      <>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href={playerId ? `/players/${playerId}` : "/"}>
                          Mój profil
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/change-password">
                          Hasło
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
                          Umiejętności
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/charts">
                          Wykresy
                        </Link>
                        {role === "admin" ? (
                          <>
                            <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/admin/trainers">
                              Trenerzy
                            </Link>
                            <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/admin/test-data">
                              Test data
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
          <footer style={{ textAlign: "center", fontSize: "0.9em", color: "#888", marginTop: 32 }}>
            © {new Date().getFullYear()} Maciej Kasperczyk &lt;maciej.kasperczyk.scriptify365@gmail.com&gt;
          </footer>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
