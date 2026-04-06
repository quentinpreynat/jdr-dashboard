export interface HeroQuestData {
  // Stats de base
  bodyPoints: number;      // PV actuels
  bodyPointsMax: number;   // PV max
  mindPoints: number;      // PM actuels
  mindPointsMax: number;   // PM max

  // Dés de combat
  attackDice: number;      // Nombre de dés d'attaque
  defenseDice: number;     // Nombre de dés de défense

  // Équipement
  weapon: string;
  armor: string;
  equipment: string[];     // Objets divers

  // Caractéristiques héros
  heroType: "barbarian" | "dwarf" | "elf" | "wizard" | "custom";
  heroName: string;        // Nom du héros (peut différer du nom du joueur)
  movement: number;        // Points de mouvement (généralement 2d6)

  // Or
  gold: number;

  // Notes libres
  notes: string;
}

export const HEROQUEST_DEFAULTS: Record<HeroQuestData["heroType"], Partial<HeroQuestData>> = {
  barbarian: {
    bodyPointsMax: 8,
    mindPointsMax: 2,
    attackDice: 3,
    defenseDice: 2,
    movement: 12,
    weapon: "Épée large",
    armor: "Aucune",
  },
  dwarf: {
    bodyPointsMax: 7,
    mindPointsMax: 3,
    attackDice: 2,
    defenseDice: 2,
    movement: 10,
    weapon: "Hache de bataille",
    armor: "Cotte de mailles",
  },
  elf: {
    bodyPointsMax: 6,
    mindPointsMax: 4,
    attackDice: 2,
    defenseDice: 2,
    movement: 12,
    weapon: "Épée longue",
    armor: "Aucune",
  },
  wizard: {
    bodyPointsMax: 4,
    mindPointsMax: 6,
    attackDice: 1,
    defenseDice: 2,
    movement: 10,
    weapon: "Dague",
    armor: "Aucune",
  },
  custom: {
    bodyPointsMax: 6,
    mindPointsMax: 4,
    attackDice: 2,
    defenseDice: 2,
    movement: 10,
    weapon: "",
    armor: "",
  },
};

// Faces du dé HeroQuest
export type HeroQuestDieFace = "skull" | "white_shield" | "black_shield" | "empty";

export const HEROQUEST_DIE_FACES: HeroQuestDieFace[] = [
  "skull",
  "white_shield",
  "white_shield",
  "black_shield",
  "black_shield",
  "empty",
];

export const HEROQUEST_DIE_LABELS: Record<HeroQuestDieFace, string> = {
  skull:        "💀 Crâne",
  white_shield: "🛡️ Bouclier blanc",
  black_shield: "⚫ Bouclier noir",
  empty:        "— Rien",
};
