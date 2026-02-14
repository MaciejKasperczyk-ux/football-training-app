"use client";

import { useEffect, useState } from "react";
import PhotoUpload from "./PhotoUpload";

type Trainer = { _id: string; name?: string; email?: string };

function calculateAge(value?: string) {
  if (!value) return null;
  const now = new Date();
  const birth = new Date(value);
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function EditPlayerPanel({ player, playerId }: { player: any; playerId: string }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(player.firstName || "");
  const [lastName, setLastName] = useState(player.lastName || "");
  const [club, setClub] = useState(player.club || "");
  const [position, setPosition] = useState(player.position || "");
  const [birthDate, setBirthDate] = useState<string>(player.birthDate ? String(new Date(player.birthDate).toISOString().slice(0, 10)) : "");
  const [dominantFoot, setDominantFoot] = useState<string>(player.dominantFoot || "");
  const [trainers, setTrainers] = useState<string[]>((player.trainers || []).map((t: any) => String(t._id || t)));
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState("");
  const [photo, setPhoto] = useState(player.photo);

  useEffect(() => {
    async function fetchTrainers() {
      const res = await fetch("/api/admin/trainers");
      if (!res.ok) return;
      const data = await res.json();
      setAllTrainers(data || []);
    }

    fetchTrainers();
  }, []);

  async function persist(nextTrainers: string[]) {
    const payload = {
      firstName,
      lastName,
      club: club || undefined,
      position: position || undefined,
      birthDate: birthDate || undefined,
      dominantFoot: dominantFoot || undefined,
      trainers: nextTrainers,
    };

    const res = await fetch(`/api/players/${playerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ? JSON.stringify(data.error) : "Nie udalo sie zapisac danych.");
      return false;
    }

    return true;
  }

  async function save() {
    setLoading(true);
    setError(null);
    const ok = await persist(trainers);
    setLoading(false);
    if (!ok) return;
    setEditing(false);
    location.reload();
  }

  async function addTrainerById(id: string) {
    if (!id || trainers.includes(id)) return;
    const next = [...trainers, id];
    setLoading(true);
    setError(null);
    const ok = await persist(next);
    setLoading(false);
    if (!ok) return;
    setTrainers(next);
    setSelectedToAdd("");
  }

  async function removeTrainerById(id: string) {
    const next = trainers.filter((value) => value !== id);
    setLoading(true);
    setError(null);
    const ok = await persist(next);
    setLoading(false);
    if (!ok) return;
    setTrainers(next);
  }

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <PhotoUpload 
        playerId={playerId} 
        currentPhoto={photo}
        onPhotoUpdate={(photoUrl) => setPhoto(photoUrl)}
      />

      {/* Player Info Section */}
      <div className="surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Dane zawodnika</h2>
            <p className="section-copy">Edycja danych i przypisywanie trenerow.</p>
          </div>
          <button onClick={() => setEditing((value) => !value)} className="btn btn-secondary">
            {editing ? "Anuluj" : "Edytuj"}
          </button>
        </div>

        {!editing ? (
          <div className="mt-4 grid gap-2 text-sm">
            <div className="font-semibold">{firstName} {lastName}</div>
            <div>Klub: {(club || "-")}</div>
            <div>Pozycja: {(position || "-")}</div>
            <div>Data urodzenia: {birthDate ? `${new Date(birthDate).toLocaleDateString("pl-PL")} (wiek: ${calculateAge(birthDate)})` : "-"}</div>
            <div>Lepsza noga: {dominantFoot ? (dominantFoot === "left" ? "Lewa" : "Prawa") : "-"}</div>

          <div className="mt-2">
            <div className="mb-2 text-xs font-semibold text-slate-500">Trenerzy</div>
            <div className="flex flex-wrap gap-2">
              {trainers.length === 0 ? <span className="text-slate-500">Brak</span> : null}
              {trainers.map((id) => {
                const trainer = allTrainers.find((value) => String(value._id) === id);
                return (
                  <span key={id} className="pill">
                    {trainer?.name ?? trainer?.email ?? id}
                    <button onClick={() => removeTrainerById(id)} className="ml-2 text-red-600">
                      x
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select value={selectedToAdd} onChange={(e) => setSelectedToAdd(e.target.value)} className="field-select">
                <option value="">Wybierz trenera...</option>
                {allTrainers.map((trainer) => (
                  <option key={trainer._id} value={String(trainer._id)}>
                    {trainer.name ?? trainer.email}
                  </option>
                ))}
              </select>
              <button onClick={() => addTrainerById(selectedToAdd)} disabled={!selectedToAdd || loading} className="btn btn-secondary">
                Dodaj
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="field-label">Imie</label>
              <input className="field-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="field-label">Nazwisko</label>
              <input className="field-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="field-label">Klub</label>
              <input className="field-input" value={club} onChange={(e) => setClub(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="field-label">Pozycja</label>
              <input className="field-input" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <label className="field-label">Data urodzenia</label>
              <input type="date" className="field-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="field-label">Lepsza noga</label>
              <select className="field-select" value={dominantFoot} onChange={(e) => setDominantFoot(e.target.value)}>
                <option value="">Wybierz</option>
                <option value="left">Lewa</option>
                <option value="right">Prawa</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1">
            <label className="field-label">Trenerzy (wielokrotny wybor)</label>
            <select
              multiple
              className="field-select h-32"
              value={trainers}
              onChange={(e) => setTrainers(Array.from(e.target.selectedOptions, (option) => option.value))}
            >
              {allTrainers.map((trainer) => (
                <option key={trainer._id} value={String(trainer._id)}>
                  {trainer.name ?? trainer.email}
                </option>
              ))}
            </select>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn btn-primary">
              {loading ? "Zapisywanie..." : "Zapisz"}
            </button>
            <button onClick={() => setEditing(false)} className="btn btn-secondary">
              Anuluj
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
