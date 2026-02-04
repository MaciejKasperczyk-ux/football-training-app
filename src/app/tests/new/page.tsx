// src/app/tests/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTestPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        unit: unit || undefined,
        description: description || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Failed");
      setLoading(false);
      return;
    }

    router.push("/tests");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Add test</h1>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4 space-y-3">
        <div className="grid gap-1">
          <label className="text-sm">Name</label>
          <input className="rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Unit</label>
          <input className="rounded border px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Description</label>
          <input className="rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60" type="submit">
          {loading ? "Saving" : "Save"}
        </button>
      </form>
    </div>
  );
}
