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
    <div className="page-wrap max-w-3xl">
      <div className="hero-card">
        <h1 className="page-title">Nowa umiejetnosc</h1>
        <p className="page-subtitle">Dodaj glowna umiejetnosc oraz jej podumiejetnosci.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-3 p-5">
        <div className="grid gap-1">
          <label className="field-label">Nazwa</label>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <label className="field-label">Opis</label>
          <input className="field-input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="section-title">Podumiejetnosci</div>
          {details.map((d, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                className="field-input"
                placeholder="Nazwa podumiejetnosci"
                value={d.name}
                onChange={(e) => setDetail(i, "name", e.target.value)}
              />
              <input
                className="field-input"
                placeholder="Opis"
                value={d.description}
                onChange={(e) => setDetail(i, "description", e.target.value)}
              />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDetails((prev) => [...prev, { name: "", description: "" }])}
          >
            Dodaj podumiejetnosc
          </button>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button disabled={loading} className="btn btn-primary" type="submit">
          {loading ? "Zapisywanie..." : "Zapisz"}
        </button>
      </form>
    </div>
  );
}
