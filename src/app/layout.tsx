import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Trening indywidualny piłki nożnej",
  description: "Baza zawodników, cele i treningi",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          {session && (
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
              <div className="mx-auto w-full max-w-6xl px-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/"
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Trening indywidualny
                    </Link>
                    <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                      {role === "admin" ? "Panel admina" : "Panel trenera"}
                    </span>
                  </div>

                  <nav className="flex items-center gap-1 text-sm">
                    <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/players">
                      Zawodnicy
                    </Link>
                    <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/trainings">
                      Treningi
                    </Link>
                    <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/skills">
                      Umiejętności
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
                    <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900" href="/logout">
                      Wyloguj
                    </Link>
                  </nav>
                </div>
              </div>
            </header>
          )}

          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
