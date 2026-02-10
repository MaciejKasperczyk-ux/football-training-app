"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ? JSON.stringify(data.error) : "Failed to change password");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => router.push("/"), 2000);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded border bg-white p-5 space-y-3">
        <h1 className="text-xl font-semibold">Zmień hasło</h1>

        <div className="space-y-1">
          <label className="text-sm">Obecne hasło</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Nowe hasło</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Potwierdź hasło</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        {success ? <div className="text-sm text-green-600">Hasło zmienione! Przekierowywanie...</div> : null}

        <button disabled={loading} className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-60" type="submit">
          {loading ? "Zmiana..." : "Zmień hasło"}
        </button>
      </form>
    </div>
  );
}
