import type { ImprovisationResult } from "../types/improvisation";

const npcList: string[] = [
  "marchand louche",
  "espion du culte",
  "ancien soldat",
  "noble ruiné",
  "voleur nerveux",
  "prêtre mystérieux",
  "chasseuse solitaire",
  "scribe épuisé",
  "forgeronne rancunière",
  "guérisseur itinérant",
  "mendiant trop bien informé",
  "capitaine de milice ambitieux",
  "apprentie mage imprudente",
  "contrebandier charmeur",
  "érudit obsédé par une relique",
  "pêcheur superstitieux",
  "messagère essoufflée",
  "aubergiste aux secrets lourds",
];

const locationList: string[] = [
  "ruelle sombre",
  "taverne bruyante",
  "temple abandonné",
  "forêt embrumée",
  "marché bondé",
  "crypte oubliée",
  "pont en ruine",
  "manoir décrépit",
  "entrepôt gardé",
  "place du village",
  "échoppe fermée",
  "campement de fortune",
  "bibliothèque poussiéreuse",
  "quais sous la pluie",
  "égouts nauséabonds",
  "colline balayée par le vent",
  "route déserte",
];

const eventList: string[] = [
  "tentative de vol",
  "bagarre soudaine",
  "arrivée de gardes",
  "incendie mystérieux",
  "découverte d'un corps",
  "coupure de courant magique",
  "dispute publique",
  "convoi attaqué",
  "animal affolé qui s'échappe",
  "message urgent livré à la mauvaise personne",
  "rituel interrompu",
  "effondrement d'un bâtiment",
  "serment brisé",
  "chasse à l'homme improvisée",
  "objet maudit repéré",
  "duel provoqué",
];

const rumorList: string[] = [
  "un culte secret recrute en ville",
  "un noble prépare un coup d'état",
  "une créature rôde dans les égouts",
  "une relique ancienne a été retrouvée",
  "la milice couvre des disparitions",
  "un navire arrive avec une cargaison interdite",
  "un héritage contesté met le feu aux poudres",
  "une prime circule sur la tête d'un innocent",
  "des rêves identiques frappent plusieurs habitants",
  "un alchimiste vend des potions frelatées",
  "un passage secret mène hors des remparts",
  "un esprit réclame réparation dans un vieux sanctuaire",
  "un groupe de mercenaires change de camp",
  "un faux prophète attire les foules",
  "une mine abandonnée a été rouverte en secret",
  "un notable finance des bandits",
  "des lettres anonymes accusent un allié",
];

const complicationList: string[] = [
  "un témoin ment",
  "un PNJ disparaît",
  "un objet est volé",
  "les gardes arrivent trop vite",
  "la foule prend parti sans preuve",
  "un allié réclame une contrepartie immédiate",
  "une piste est volontairement falsifiée",
  "un rival reconnaît un PJ",
  "la météo tourne au pire moment",
  "une porte est verrouillée de l'intérieur",
  "le vrai coupable est protégé",
  "un enchantement perturbe les souvenirs",
  "une dette ancienne resurgit",
  "un messager est intercepté",
  "un plan se retourne contre les PJ",
  "un innocent est accusé",
];

function randomFloat(): number {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== "function") {
    return Math.random();
  }

  const buffer = new Uint32Array(1);
  cryptoObj.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

export function getRandomItem<T>(array: readonly T[]): T {
  if (array.length === 0) {
    throw new Error("getRandomItem: array is empty");
  }

  const index = Math.floor(randomFloat() * array.length);
  return array[Math.max(0, Math.min(array.length - 1, index))] ?? array[0];
}

export function generateImprovisation(): ImprovisationResult {
  return {
    npc: getRandomItem(npcList),
    location: getRandomItem(locationList),
    event: getRandomItem(eventList),
    rumor: getRandomItem(rumorList),
    complication: getRandomItem(complicationList),
  };
}
