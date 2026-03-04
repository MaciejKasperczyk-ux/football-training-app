"use client";

import { useEffect, useState } from "react";
import { AGE_GROUP_OPTIONS } from "@/lib/ageGroups";

type TrainerRole = "trainer" | "club_trainer";

interface Trainer {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  club?: string;
  yearGroups?: string[];
  role: TrainerRole;
  createdAt: string;
}

function getErrorMessage(raw: unknown): string {
  if (!raw) return "Nie udalo sie wykonac operacji.";
  if (typeof raw === "string") return raw;
  return JSON.stringify(raw);
}

function splitName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") || "" };
}

function roleLabel(role: TrainerRole) {
  return role === "club_trainer" ? "Trener klubowy (read only)" : "Trener";
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [club, setClub] = useState("");
  const [yearGroups, setYearGroups] = useState<string[]>([]);
  const [role, setRole] = useState<TrainerRole>("trainer");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editClub, setEditClub] = useState("");
  const [editYearGroups, setEditYearGroups] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<TrainerRole>("trainer");
  const [savingEdit, setSavingEdit] = useState(false);

  async function fetchTrainers() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/trainers");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError("Nie udalo sie pobrac trenerow.");
      setLoading(false);
      return;
    }
    setTrainers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    void fetchTrainers();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setTemporaryPassword(null);

    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName, phone, club, yearGroups, role }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(getErrorMessage(data?.error) || "Nie udalo sie utworzyc konta.");
      setSubmitting(false);
      return;
    }

    setTemporaryPassword(data?.temporaryPassword ?? null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setClub("");
    setYearGroups([]);
    setRole("trainer");
    setSubmitting(false);
    await fetchTrainers();
  }

  function startEdit(trainer: Trainer) {
    const parsed = splitName(trainer.name ?? "");
    setEditingId(trainer._id);
    setEditFirstName(parsed.firstName);
    setEditLastName(parsed.lastName);
    setEditEmail(trainer.email ?? "");
    setEditPhone(trainer.phone ?? "");
    setEditClub(trainer.club ?? "");
    setEditYearGroups(Array.isArray(trainer.yearGroups) ? trainer.yearGroups : []);
    setEditRole((trainer.role as TrainerRole) || "trainer");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFirstName("");
    setEditLastName("");
    setEditEmail("");
    setEditPhone("");
    setEditClub("");
    setEditYearGroups([]);
    setEditRole("trainer");
  }

  async function saveEdit(id: string) {
    setSavingEdit(true);
    setError(null);
    const res = await fetch(`/api/admin/trainers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: editEmail,
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        club: editClub,
        yearGroups: editYearGroups,
        role: editRole,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(getErrorMessage(data?.error) || "Nie udalo sie zapisac zmian.");
      setSavingEdit(false);
      return;
    }
    setSavingEdit(false);
    cancelEdit();
    await fetchTrainers();
  }

  async function deleteTrainer(id: string) {
    if (!confirm("Usunac to konto?")) return;
    const res = await fetch(`/api/admin/trainers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Nie udalo sie usunac konta.");
      return;
    }
    if (editingId === id) cancelEdit();
    await fetchTrainers();
  }

  return (
    <div className="page-wrap">
      <div className="hero-card">
        <h1 className="page-title">Trenerzy</h1>
        <p className="page-subtitle">Krotki formularz tworzenia i edycji kont.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="section-title">Nowe konto</h2>
          <form onSubmit={onSubmit} className="mt-3 grid gap-3">
            <input className="field-input" placeholder="Imie" value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
            <input className="field-input" placeholder="Nazwisko" value={lastName} onChange={(event) => setLastName(event.target.value)} required />
            <input className="field-input" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input className="field-input" type="tel" placeholder="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} required />
            <input className="field-input" placeholder="Klub" value={club} onChange={(event) => setClub(event.target.value)} required />
            <select className="field-select" value={role} onChange={(event) => setRole(event.target.value as TrainerRole)}>
              <option value="trainer">Trener</option>
              <option value="club_trainer">Trener klubowy (read only)</option>
            </select>
            <select
              multiple
              value={yearGroups}
              onChange={(event) => setYearGroups(Array.from(event.target.selectedOptions, (option) => option.value))}
              className="field-select h-32"
              required
            >
              {AGE_GROUP_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <button disabled={submitting} className="btn btn-primary" type="submit">
              {submitting ? "Tworzenie..." : "Utworz konto"}
            </button>
          </form>

          {temporaryPassword ? (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
              <div className="font-semibold">Haslo tymczasowe:</div>
              <code className="mt-2 block rounded bg-slate-900 px-2 py-1 text-xs text-white">{temporaryPassword}</code>
            </div>
          ) : null}
          {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
        </section>

        <section className="surface p-5">
          <h2 className="section-title">Lista kont</h2>
          {loading ? <div className="mt-3 text-sm text-slate-600">Ladowanie...</div> : null}
          {!loading && trainers.length === 0 ? <div className="mt-3 text-sm text-slate-600">Brak kont.</div> : null}
          <div className="mt-3 grid gap-3 max-h-[34rem] overflow-y-auto">
            {trainers.map((trainer) => {
              const isEditing = editingId === trainer._id;
              if (isEditing) {
                return (
                  <div key={trainer._id} className="surface-muted p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="field-input" value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} />
                      <input className="field-input" value={editLastName} onChange={(event) => setEditLastName(event.target.value)} />
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input className="field-input" type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
                      <input className="field-input" type="tel" value={editPhone} onChange={(event) => setEditPhone(event.target.value)} />
                    </div>
                    <input className="field-input mt-2" value={editClub} onChange={(event) => setEditClub(event.target.value)} />
                    <select className="field-select mt-2" value={editRole} onChange={(event) => setEditRole(event.target.value as TrainerRole)}>
                      <option value="trainer">Trener</option>
                      <option value="club_trainer">Trener klubowy (read only)</option>
                    </select>
                    <select
                      multiple
                      value={editYearGroups}
                      onChange={(event) => setEditYearGroups(Array.from(event.target.selectedOptions, (option) => option.value))}
                      className="field-select mt-2 h-28"
                    >
                      {AGE_GROUP_OPTIONS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                        Anuluj
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => saveEdit(trainer._id)} disabled={savingEdit}>
                        {savingEdit ? "Zapisywanie..." : "Zapisz"}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={trainer._id} className="surface-muted p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{trainer.name}</div>
                      <div className="text-sm text-slate-700">{trainer.email}</div>
                      <div className="text-sm text-slate-600">{trainer.phone ?? "-"}</div>
                      <div className="text-sm text-slate-600">Klub: {trainer.club ?? "-"}</div>
                      <div className="text-sm text-slate-600">Grupy: {trainer.yearGroups?.join(", ") || "-"}</div>
                      <div className="mt-1 inline-block rounded-full border border-slate-300 px-2 py-0.5 text-xs">{roleLabel(trainer.role)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-secondary" onClick={() => startEdit(trainer)}>
                        Edytuj
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => deleteTrainer(trainer._id)}>
                        Usun
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
