export const AGE_GROUP_OPTIONS = [
  "U6",
  "U7",
  "U8",
  "U9",
  "U10",
  "U11",
  "U12",
  "U13",
  "U14",
  "U15",
  "U16",
  "U17",
  "U18",
  "U19",
] as const;

export type AgeGroup = (typeof AGE_GROUP_OPTIONS)[number];

export function normalizeAgeGroup(value: string): AgeGroup | null {
  const normalized = value.trim().toUpperCase();
  if ((AGE_GROUP_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as AgeGroup;
  }
  return null;
}

export function ageToGroup(age: number | null | undefined): AgeGroup | null {
  if (typeof age !== "number" || !Number.isFinite(age)) return null;
  const candidate = `U${Math.floor(age)}`;
  return normalizeAgeGroup(candidate);
}
