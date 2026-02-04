"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePlayerButton({ playerId }: { playerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = window.confirm("Czy na pewno usunąć zawodnika?");
    if (!ok) return;

    setLoading(true);

    const res = await fetch(`/api/players/${playerId}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      alert("Nie udało się usunąć zawodnika");
      return;
    }

    router.push("/players");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onDelete}
      className="rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "Usuwanie" : "Usuń"}
    </button>
  );
}
