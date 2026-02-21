import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

function loadMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return "";

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "MONGODB_URI") continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return "";
}

const uri = loadMongoUri();
if (!uri) {
  throw new Error("Missing MONGODB_URI (env or .env.local)");
}

const SubSkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    difficulty: { type: Number, enum: [1, 2, 3], default: 1, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: false, trim: true },
    details: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubSkill" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SubSkill = mongoose.models.SubSkill || mongoose.model("SubSkill", SubSkillSchema);
const Skill = mongoose.models.Skill || mongoose.model("Skill", SkillSchema);

const catalog = [
  {
    name: "Poruszanie się bez piłki",
    levels: {
      1: [
        "Zatrzymywanie małymi krokami",
        "Jedna noga lekko z przodu przy hamowaniu",
        "Pierwszy krok biegu lekko skrócony",
        "Sugestywny balans (ruch zwodny)",
        "Tułów lekko pochylony",
        "Praca ramion w trakcie biegu",
      ],
      2: [
        "Obniżenie środka ciężkości przy hamowaniu",
        "Balans ciała przed zmianą kierunku",
        "Zatrzymanie szeroko na nogach",
        "Przerzut barków przy zmianie kierunku",
        "Pierwszy i drugi krok wykonany do pięty",
      ],
      3: [
        "Przyspieszenie nogi zakrocznej (wahadło)",
        "Obserwacja piłki i partnerów w każdym kroku",
        "Nawrót rozpoczęty od obrotu głowy",
      ],
    },
  },
  {
    name: "Podania i przyjęcia w miejscu",
    levels: {
      1: [
        "Kostka stopy postawnej na wysokości piłki",
        "Dynamiczny zamach przed uderzeniem piłki",
        "Nogi szeroko, tułów lekko pochylony",
        "Ręce swobodne, lekko ugięte",
        "Uderzenie w środek piłki",
        "Kolano w nodze uderzającej zablokowane",
        "Amortyzacja piłki w przyjęciu",
      ],
      2: [
        "Przyspieszenie trzech kroków po podaniu",
        "Dynamiczny, skrócony dobieg do piłki",
        "Nadbiegnięcie z wyprzedzeniem nogi postawnej",
        "Ruch zwodny w przyjęciu",
        "Stopa uderzająca skierowana w kierunku podania",
      ],
      3: [
        "Uderzenie piłki bez kontaktu wzrokowego",
        "Ocena gotowości przyjęcia partnera (ocena jego postawy)",
        "Obserwacja ustawienia obrońców",
      ],
    },
  },
  {
    name: "Poruszanie się z piłką",
    levels: {
      1: [
        "Obniżenie środka ciężkości przy zmianie kierunku",
        "Aktywna praca rąk (ochrona piłki)",
        "Przyspieszenie nogi zakrocznej w każdym kroku",
        "Szeroko na nogach podczas presji rywala",
        "Kontrola i czucie piłki stopą",
        "Tułów pochylony w przód",
      ],
      2: [
        "Skręt barków przy zmianie kierunku biegu",
        "Przyspieszenie po zmianie kierunku prowadzenia",
        "Zwolnienie przed zmianą kierunku biegu (z obrońcą)",
        "Przerzut barków przy zmianie kierunku",
        "Nadbiegnięcie nogi postawnej przed toczącą się piłkę",
      ],
      3: [
        "Gotowość podania w każdym kontakcie z piłką",
        "Obserwacja partnerów i obrońców w każdym kroku",
        "Zdobywanie przestrzeni w każdym kontakcie z piłką",
      ],
    },
  },
  {
    name: "Strzały",
    levels: {
      1: [
        "Gotowość do strzału w postawie piłkarskiej",
        "Noga postawna na wysokości piłki",
        "Kostka stopy postawnej na wysokości piłki",
        "Dynamiczny zamach przed uderzeniem piłki",
        "Zamknięcie sylwetki po strzale",
        "Lądowanie na uderzającej nodze",
        "Stopa uderzająca usztywniona",
      ],
      2: [
        "Przyspieszenie trzech kroków po uderzeniu (dobitka)",
        "Dynamiczny, skrócony dobieg do piłki",
        "Przyspieszenie nogi zakrocznej po przyjęciu",
        "Po uderzeniu stopa uderzająca skierowana w kierunku strzału",
        "Rozciągnięcie ramienia przed strzałem",
      ],
      3: [
        "Uderzenie bez kontaktu wzrokowego z piłką",
        "Ocena ustawienia bramkarza przed strzałem",
        "Obserwacja bramkarza i partnerów podczas dobiegu do piłki",
      ],
    },
  },
  {
    name: "Krycie gracza z piłką - faza 1",
    levels: {
      1: [
        "Doskok z zatrzymaniem nisko na nogach",
        "Atak bark w bark uderzeniem w kierunku z dołu do góry",
        "Reakcja kontrolująca biodro przeciwnika",
        "Wstawienie nogi i założenie ręki za rywala w odbiorze",
        "Utrzymanie bioder daleko z tyłu w postawie obronnej",
        "Kontrola odległości do rywala za pomocą wyprostowanej ręki",
      ],
      2: [
        "Obserwacja bioder przeciwnika",
        "Kontrola wzrokowa ustawienia innych obrońców",
        "Przejście do kroku biegowego w chwili utraty odległości",
        "Przesunięcie postawy lekko w bok względem rywala (zamknięcie strony)",
        "Komunikacja z partnerami o realizowanej fazie",
      ],
      3: [
        "Odbiór piłki w momencie błędu w prowadzeniu piłki przez rywala",
        "Utrzymanie odległości umożliwiającej minięcie zawodnika z piłką",
        "Doskok do rywala w momencie odwrócenia się od kierunku ataku",
      ],
    },
  },
  {
    name: "Zerwanie krycia w kontakcie (uwolnienie się z presji rywala)",
    levels: {
      1: [
        "Atak strony pleców rywala",
        "Kontakt barkiem z obrońcą, kontrola ręką",
        "Wzrok uniesiony w momencie przyjęcia piłki",
        "Ruch zwrotny przed dojściem do obrońcy",
        "Komunikacja z przyjęciem piłki",
        "Nisko, szeroko na nogach",
      ],
      2: [
        "Obserwacja ustawienia obrońców",
        "Decyzja drugiego kroku (wybór opcji gry)",
        "Gotowość do zmiany kierunku w każdym kroku",
        "Przyspieszenie 3 kroków po wyborze opcji",
        "Szukanie kontaktu z obrońcą, założenie nogi",
      ],
      3: [
        "Naprzemienna obserwacja ciała piłki i partnerów",
        "Kontynuacja gry w momencie nietrzymania piłki",
        "Gotowość do podania, strzału lub prowadzenia",
      ],
    },
  },
  {
    name: "Bieg z podaniami",
    levels: {
      1: [
        "Kostka stopy postawnej na wysokości piłki",
        "Dynamiczny zamach przed uderzeniem piłki",
        "Pozycja otwarta w przyjęciu",
        "Mocna praca ramion w trakcie biegu",
        "Uderzenie w środek piłki",
        "Komunikacja z partnerem",
        "Amortyzacja piłki w przyjęciu",
      ],
      2: [
        "Gotowość do kolejnego podania, do prowadzenia lub strzału",
        "Obserwacja partnerów przed przyjęciem piłki",
        "Przyjęcie zdobywające przestrzeń, słabszą lub bliższą nogą",
        "Podanie bez kontaktu wzrokowego",
        "Przyspieszenie trzech kroków po podaniu",
      ],
      3: [
        "Obserwacja ustawienia ciała partnera i jego kierunku biegu",
        "Obserwacja przestrzeni, w której partner może przyjąć piłkę",
        "Obserwacja ustawienia obrońców",
      ],
    },
  },
  {
    name: "Atakowanie 1v1 przodem do bramki",
    levels: {
      1: [
        "Obniżenie środka ciężkości przy zmianie kierunku",
        "Aktywna praca rąk (ochrona piłki)",
        "Prowadzenie piłki dalszą nogą od obrońcy",
        "Szeroko na nogach podczas presji rywala",
        "Bliski kontakt stopy z piłką",
        "Tułów pochylony w przód",
      ],
      2: [
        "Odskok pod presją w tył (tworzenie przestrzeni do minięcia)",
        "Przyspieszenie po zmianie kierunku prowadzenia",
        "Zwolnienie przed zmianą kierunku biegu (z obrońcą)",
        "Ruch zwodny, balans tułowia",
        "Skręt barków przy zmianie kierunku biegu",
      ],
      3: [
        "Gotowość strzału w każdym kontakcie z piłką",
        "Obserwacja ustawienia pozostałych obrońców",
        "Obserwacja ustawienia obrońcy (atak bliżej nogi)",
      ],
    },
  },
  {
    name: "Krycie gracza bez piłki - ścisłe, zamknięte w pressingu - obrona czarna",
    levels: {
      1: [
        "Kontakt ręki z plecami rywala",
        "Kontakt barkiem z obrońcą, kontrola ręką",
        "Uniemożliwienie rywalowi wejścia między siebie a piłkę",
        "Ruch zwodny przed dojściem do obrońcy",
        "Pozycja nisko i szeroko na nogach",
        "Wolna ręka blisko ciała",
      ],
      2: [
        "Stopa w nadbiegnięciu dalej niż stopa przeciwnika",
        "Lekkie spychanie rywala barkiem",
        "Gotowość do zmiany kierunku w każdym kroku",
        "Informacja dla partnerów o sposobie obrony",
        "Wzrok skierowany na krytego zawodnika",
      ],
      3: [
        "Wpływ na rywala (myślenie o otrzymaniu piłki)",
        "Utrzymanie kontaktu fizycznego barkiem",
        "Nadbiegnięcie w wyprzedzeniem rywala",
      ],
    },
  },
  {
    name: "Krycie zawodnika bez piłki - ścisła, półzamknięta (obrona niebieska)",
    levels: {
      1: [
        "Utrzymanie bioder mocno z tyłu",
        "Ręka broniąca podanie lekko zgięta w łokciu",
        "Ręka i noga bliżej piłki ustawione na linii podania",
        "Łokieć ręki broniącej podanie ustawiony na wysokości piłki",
        "Pozycja nisko, szeroko na nogach",
        "Lekkie spychanie przeciwnika przedramieniem",
      ],
      2: [
        "Łokieć ręki odcinającej na wysokości piłki",
        "Utrzymanie pozycji tyłem do własnej bramki",
        "Dłoń odcinająca podanie ustawiona kciukiem w dół",
        "Komunikacja (niebieska, niebieska)",
        "Przejście do kroku biegowego w chwili utraty kontaktu",
      ],
      3: [
        "Wzrok skierowany cały czas na piłkę",
        "Utrzymanie kontaktu przedramieniem",
        "Ręka i noga bliżej piłki ustawione na linii podania",
      ],
    },
  },
  {
    name: "Zerwanie krycia w przestrzeni - uwolnienie ze struktury obronnej rywala",
    levels: {
      1: [
        "Amortyzacja piłki w przyjęciu",
        "Możliwa zmiana kierunku biegu w każdym kroku",
        "Zmiany kierunku przez odbicie lub balans",
        "Komunikacja niewerbalna z partnerem z piłką",
        "Bieg tylko na prostych",
        "Ustawienie partnera w przerwy w piłce",
      ],
      2: [
        "Kontynuacja ruchu w momencie nieotrzymania piłki",
        "Zakaz powrotu na tę samą pozycję",
        "Wysoka zmiana tempa od startu do sprintu",
        "Poruszanie się zawsze w posiadanie piłki",
        "Zdobywanie kolejnych przestrzeni w posiadanie piłki",
      ],
      3: [
        "Absolutny zakaz wbiegania dwóch graczy w tę samą przestrzeń",
        "Rozpoczęcie ruchu wykorzystujące nieuwagę obrońcy",
        "Synchronizacja ruchów między partnerami (wzięcie partnera przed ruchem)",
      ],
    },
  },
  {
    name: "Krycie zawodnika bez piłki - luźna otwarta w przestrzeni obrona żółta",
    levels: {
      1: [
        "Nieustanna reakcja na ruch piłki i ruch krytego zawodnika",
        "Poruszanie się w obronie najmniejszą potrzebną liczbą kroków",
        "Gotowość dalszej ręki od piłki do wejścia w kontakt z rywalem",
        "Obserwacja pozostałych graczy w bronieniu",
        "Pozycja wyjściowa tyłem do własnej bramki",
        "Ustawienie ciała lekko bokiem",
      ],
      2: [
        "Komunikacja dotycząca ustawienia pozostałych rywali",
        "Ustawienie w 1/3 odległości między piłką a krytym graczem",
        "Przejście w krycia gracza z piłką do obrony żółtej właściwym krokiem",
        "Ustawienie z jednoczesną obserwacją krytego przeciwnika i piłki",
        "Przejście do kroku biegowego kiedy piłka jest zagrana za plecy",
      ],
      3: [
        "W kroku biegowym naprzemienna obserwacja piłki i rywala",
        "Gotowość wejścia w bronienie gracza z piłką w fazie 1 i 2 lub odbioru",
        "Gotowość do natychmiastowej zmiany krytego zawodnika",
      ],
    },
  },
  {
    name: "Krycie gracza z piłką - faza 2 i 3",
    levels: {
      1: [
        "Aktywna praca rąk",
        "Atak bark w bark, z uderzeniem w kierunku z dołu do góry",
        "Ręka kontrolująca biodro przeciwnika w fazie 3",
        "Wstawienie nogi i zatrzymanie przed rywalem w odbiorze",
        "Przejście do kroku biegowego w chwili utraty odległości",
        "Wymuszenie na przeciwniku zmiany kierunku biegu",
      ],
      2: [
        "Nadbiegnięcie i powrót do fazy 1",
        "Wejście przed rywala w momencie odbioru piłki",
        "Obrona najbliższego wolnego gracza w fazie 3",
        "Utrzymanie krycia w podwyższonej obronie (obrona czerwona)",
        "Utrzymanie ciągłości działań obronnych",
      ],
      3: [
        "Kontrola wzrokowa ustawienia innych obrońców",
        "Ocena skutecznych działań z wejściem na sektor boiska",
        "Atak przeciwnika w celu zmiany kierunku gry do tyłu",
      ],
    },
  },
  {
    name: "Atakowanie 1v1 tyłem do bramki",
    levels: {
      1: [
        "Przytrzymanie piłki w celu ściągnięcia obrońców",
        "Jedna ręka kontroluje dystans do rywala",
        "Kontrola piłki na dalszej nodze",
        "Pod presją tylna noga pomiędzy nogami rywala",
        "Barki i biodra niżej od obrońcy",
        "Ochrona piłki ciałem w momencie minięcia",
      ],
      2: [
        "Odskok pod presją (stworzenie przestrzeni do minięcia)",
        "Kontakt z rywalem (wypchnięcie) do wygodnej dla siebie pozycji",
        "Krok przed otrzymaniem piłki, wstawienie nogi przed rywala",
        "Obserwacja innych obrońców czy nie nadbiega pomoc",
      ],
      3: [
        "Gotowość do strzału lub podania w każdym kontakcie z piłką",
        "Obserwacja ustawienia partnerów przed otrzymaniem piłki",
        "Obserwacja ustawienia obrońcy przed otrzymaniem piłki",
      ],
    },
  },
  {
    name: "Krycie zawodnika bez piłki - zamknięta w kontakcie i w przestrzeni obrona szara",
    levels: {
      1: [
        "Postawa nisko, szeroko na nogach",
        "Ręce szeroko w momencie kontaktu z rywalem",
        "Uniemożliwienie rywalowi wejścia przed siebie do piłki",
        "W kontakcie ręka na kolcu biodrowym rywala",
        "Przyjęcie rywala biodrami",
        "Komunikacja z kontaktującymi się zawodnikami",
      ],
      2: [
        "Gotowość do wejścia w odwróconą obronę niebieską bądź żółtą",
        "Pozycja otwarta bokiem dla obu faz gry (atakowanie i bronienie)",
        "Dostosowanie odległości do rywala w zależności od momentu gry",
        "Informowanie partnerów o sposobie obrony",
        "Wypychanie tyłem rywala lub złapanie na pozycji spalonego",
      ],
      3: [
        "Wpływ na rywala (myślenie: nie wejść w boczne sektory)",
        "Naprzemienna obserwacja ciała i przeciwnika",
        "Zamknięcie linii podania zgodnie z ruchem rywala",
      ],
    },
  },
];

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

await mongoose.connect(uri);

const subskillCache = new Map();
let createdSubskills = 0;
let reusedSubskills = 0;
let upsertedSkills = 0;

for (const skill of catalog) {
  const detailIds = [];

  for (const [difficultyKey, items] of Object.entries(skill.levels)) {
    const difficulty = Number(difficultyKey);

    for (const rawName of items) {
      const name = normalizeText(rawName);
      const cacheKey = `${difficulty}|${name}`;

      let sub = subskillCache.get(cacheKey);
      if (!sub) {
        sub = await SubSkill.findOne({ name, difficulty });
        if (!sub) {
          sub = await SubSkill.create({ name, difficulty, isActive: true });
          createdSubskills += 1;
        } else {
          reusedSubskills += 1;
        }
        subskillCache.set(cacheKey, sub);
      }

      if (!detailIds.some((id) => String(id) === String(sub._id))) {
        detailIds.push(sub._id);
      }
    }
  }

  await Skill.findOneAndUpdate(
    { name: normalizeText(skill.name) },
    {
      $set: {
        name: normalizeText(skill.name),
        details: detailIds,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  upsertedSkills += 1;
}

console.log("Seed complete");
console.log("Skills upserted:", upsertedSkills);
console.log("Subskills created:", createdSubskills);
console.log("Subskills reused:", reusedSubskills);

await mongoose.disconnect();

