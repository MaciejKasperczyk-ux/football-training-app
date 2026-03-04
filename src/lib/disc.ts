export type DiscLetter = "D" | "I" | "S" | "C";
export type DiscArea = "sport" | "family";
export type DiscAssignedTo = "player" | "admin";
export type DiscStatus = "pending" | "completed";

export type DiscStatement = {
  id: string;
  text: string;
  letter: DiscLetter;
};

export type DiscQuestionGroup = {
  id: string;
  statements: [DiscStatement, DiscStatement, DiscStatement, DiscStatement];
};

export const DISC_POINTS = [4, 3, 2, 1] as const;

export const DISC_AREAS: Array<{ value: DiscArea; label: string }> = [
  { value: "sport", label: "Obszar sportowy" },
  { value: "family", label: "Obszar rodzinny" },
];

export const DISC_QUESTION_GROUPS: DiscQuestionGroup[] = [
  {
    id: "g1",
    statements: [
      { id: "g1_s1", text: "Jestem optymistyczny", letter: "I" },
      { id: "g1_s2", text: "Jestem pewny siebie", letter: "D" },
      { id: "g1_s3", text: "Jestem dokladny", letter: "C" },
      { id: "g1_s4", text: "Unikam konfliktow", letter: "S" },
    ],
  },
  {
    id: "g2",
    statements: [
      { id: "g2_s1", text: "Dzialam z rozwaga", letter: "C" },
      { id: "g2_s2", text: "Lubie ludzi", letter: "I" },
      { id: "g2_s3", text: "Wole sluchac niz mowic", letter: "S" },
      { id: "g2_s4", text: "Dzialam odwaznie", letter: "D" },
    ],
  },
  {
    id: "g3",
    statements: [
      { id: "g3_s1", text: "Jestem cierpliwy", letter: "S" },
      { id: "g3_s2", text: "Dzialam bez namyslu", letter: "I" },
      { id: "g3_s3", text: "Sam decyduje o tym, co robie", letter: "D" },
      { id: "g3_s4", text: "Jestem opanowany", letter: "C" },
    ],
  },
  {
    id: "g4",
    statements: [
      { id: "g4_s1", text: "Postepuje stanowczo", letter: "D" },
      { id: "g4_s2", text: "Wole byc ostrozny", letter: "C" },
      { id: "g4_s3", text: "Zawsze wspolpracuje z innymi", letter: "S" },
      { id: "g4_s4", text: "Wiele spraw mnie zachwyca", letter: "I" },
    ],
  },
  {
    id: "g5",
    statements: [
      { id: "g5_s1", text: "Ufam innym", letter: "S" },
      { id: "g5_s2", text: "Analizuje kazda sprawe", letter: "C" },
      { id: "g5_s3", text: "Lubie byc zauwazony", letter: "I" },
      { id: "g5_s4", text: "Mam silna wole, stawiam na swoim", letter: "D" },
    ],
  },
  {
    id: "g6",
    statements: [
      { id: "g6_s1", text: "Najwazniejszy jest dla mnie wynik", letter: "D" },
      { id: "g6_s2", text: "Lubie spokoj i rownowage", letter: "S" },
      { id: "g6_s3", text: "Dzialam szybko i chetnie", letter: "I" },
      { id: "g6_s4", text: "Robie wszystko dokladnie", letter: "C" },
    ],
  },
  {
    id: "g7",
    statements: [
      { id: "g7_s1", text: "Jestem pozytywnie nastawiony", letter: "I" },
      { id: "g7_s2", text: "Zalezy mi, zeby byc najlepszym", letter: "D" },
      { id: "g7_s3", text: "Ciezko mnie sprowokowac", letter: "C" },
      { id: "g7_s4", text: "Wspieram innych", letter: "S" },
    ],
  },
  {
    id: "g8",
    statements: [
      { id: "g8_s1", text: "Jestem krytyczny i analizuje", letter: "C" },
      { id: "g8_s2", text: "Bywam pobudzony i impulsywny", letter: "I" },
      { id: "g8_s3", text: "Dzialam sumiennie i solidnie", letter: "S" },
      { id: "g8_s4", text: "Wyznaczam i osiagam cele", letter: "D" },
    ],
  },
  {
    id: "g9",
    statements: [
      { id: "g9_s1", text: "Lubie rozmawiac z ludzmi", letter: "I" },
      { id: "g9_s2", text: "Jestem skromny", letter: "S" },
      { id: "g9_s3", text: "Nikogo sie nie boje", letter: "D" },
      { id: "g9_s4", text: "Jestem zorganizowany", letter: "C" },
    ],
  },
  {
    id: "g10",
    statements: [
      { id: "g10_s1", text: "Jestem wytrwaly", letter: "D" },
      { id: "g10_s2", text: "Bardzo wierze w to, co mowie", letter: "I" },
      { id: "g10_s3", text: "Planuje to, co robie", letter: "C" },
      { id: "g10_s4", text: "Jestem pokojowo nastawiony", letter: "S" },
    ],
  },
];

export function scoreDiscAnswers(answers: Record<string, number>) {
  const scores: Record<DiscLetter, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const group of DISC_QUESTION_GROUPS) {
    for (const statement of group.statements) {
      const pts = Number(answers[statement.id] ?? 0);
      if (pts >= 1 && pts <= 4) {
        scores[statement.letter] += pts;
      }
    }
  }
  return scores;
}

export function dominantDisc(scores: Record<DiscLetter, number>) {
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "D") as DiscLetter;
}
