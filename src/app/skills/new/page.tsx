// src/app/skills/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Detail = { name: string; description: string };

export default function NewSkillPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState<Detail[]>([{ name: "", description: "" }]);

  function setDetail(i: number, key: keyof Detail, value: string) {
    setDetails((prev) => prev.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanDetails = details
      .map((d) => ({ name: d.name.trim(), description: d.description.trim() || undefined }))
      .filter((d) => d.name.length > 0);

    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        details: cleanDetails.length ? cleanDetails : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Failed");
      setLoading(false);
      return;
    }

    router.push("/skills");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Add skill</h1>

      <form onSubmit={onSubmit} className="rounded border bg-white p-4 space-y-3">
        <div className="grid gap-1">
          <label className="text-sm">Name</label>
          <input className="rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Description</label>
          <input className="rounded border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="font-medium text-sm">Details</div>
          {details.map((d, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                className="rounded border px-3 py-2"
                placeholder="Detail name"
                value={d.name}
                onChange={(e) => setDetail(i, "name", e.target.value)}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Description"
                value={d.description}
                onChange={(e) => setDetail(i, "description", e.target.value)}
              />
            </div>
          ))}

          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={() => setDetails((prev) => [...prev, { name: "", description: "" }])}
          >
            Add detail
          </button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button disabled={loading} className="rounded bg-black px-3 py-2 text-white text-sm disabled:opacity-60" type="submit">
          {loading ? "Saving" : "Save"}
        </button>
      </form>
    </div>
  );
}
