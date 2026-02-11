"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ChangePasswordPage() {
  const { status } = useSession();
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
    return <div className="flex min-h-screen items-center justify-center">Ladowanie...</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Hasla nie sa identyczne");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Haslo musi miec co najmniej 6 znakow");
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
    <div className="min-h-[70vh] grid place-items-center">
      <div className="w-full max-w-md space-y-4">
        <div className="hero-card">
          <h1 className="page-title">Zmien haslo</h1>
          <p className="page-subtitle">Bezpieczenstwo konta i dostep do panelu.</p>
        </div>

        <form onSubmit={onSubmit} className="surface space-y-3 p-5">
          <div className="space-y-1">
            <label className="field-label">Obecne haslo</label>
            <input className="field-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="field-label">Nowe haslo</label>
            <input className="field-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="field-label">Potwierdz haslo</label>
            <input className="field-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {success ? <div className="text-sm text-green-600">Haslo zmienione. Przekierowanie...</div> : null}

          <button disabled={loading} className="btn btn-primary w-full" type="submit">
            {loading ? "Zmiana..." : "Zmien haslo"}
          </button>
        </form>
      </div>
    </div>
  );
}
