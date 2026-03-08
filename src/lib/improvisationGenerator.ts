import type { ImprovisationResult } from "../types/improvisation";

export type ImprovisationCategory =
  | "complet"
  | "rebondissement"
  | "pnj"
  | "complication";

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
  "fossoyeur taciturne",
  "druide errant",
  "herboriste aveugle",
  "exilé royal masqué",
  "mercenaire fanatique",
  "cartographe paranoïaque",
  "chanteuse de taverne ensorcelée",
  "vétéran brisé par la guerre",
  "apothicaire cupide",
  "apprenti scribe menteur",
  "prédicateur apocalyptique",
  "garde corrompu",
  "intendant exsangue",
  "pèlerin silencieux",
  "spectre lié à une promesse",
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
  "chapelle en cendres",
  "auberge frappée par la peste",
  "moulin abandonné",
  "tour de guet en ruine",
  "cimetière envahi de ronces",
  "carrière de pierre maudite",
  "tunnel effondré",
  "salle d'audience désertée",
  "forge éteinte",
  "entrepôt d'épices scellé",
  "verger noyé dans le brouillard",
  "lac noir immobile",
  "caverne aux échos étranges",
  "ruines noyées",
  "sanctuaire profané",
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
  "alerte aux cloches de la ville",
  "pont miné s'écroule",
  "tempête surnaturelle éclate",
  "exécution publique annulée",
  "malédiction révélée",
  "apparition d'un présage",
  "incursion de bandits",
  "explosion d'alchimiste",
  "festival tournant au chaos",
  "incendie volontaire",
  "monstre libéré de sa cage",
  "rituel d'invocation raté",
  "regard figé par un artefact",
  "apparition d'un messager royal",
  "verrou sacré brisé",
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
  "un puits murmure la nuit",
  "un enfant disparu serait encore vivant",
  "un ancien pacte se réveille",
  "une malédiction suit une lignée",
  "des bêtes fuient vers le nord",
  "un coffre impérial a été détourné",
  "un mage renégat se cache en ville",
  "la tour du guet brûle chaque nuit",
  "un passage vers l'Autre-Monde s'est rouvert",
  "un spectre protège une tombe oubliée",
  "des pièces d'or disparaissent des bourses",
  "un prêtre falsifie les rites",
  "des armes enchantées circulent",
  "un conseil secret prépare une purge",
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
  "un serment interdit lie la scène",
  "une trahison est en cours",
  "une bourse piégée explose",
  "un symbole attire des fanatiques",
  "un double se fait passer pour un allié",
  "un piège magique se déclenche",
  "les autorités mentent",
  "un passage se scelle soudainement",
  "un allié est pris en otage",
  "un rituel secondaire s'active",
  "les preuves disparaissent",
  "une alarme silencieuse se déclenche",
  "un gardien s'éveille",
  "un mensonge remonte à la surface",
  "l'enquêteur devient suspect",
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

export function generateNpc(): string {
  return getRandomItem(npcList);
}

export function generateLocation(): string {
  return getRandomItem(locationList);
}

export function generateEvent(): string {
  return getRandomItem(eventList);
}

export function generateRumor(): string {
  return getRandomItem(rumorList);
}

export function generateComplication(): string {
  return getRandomItem(complicationList);
}

export function generateByCategory(
  category: ImprovisationCategory,
): Partial<ImprovisationResult> {
  switch (category) {
    case "rebondissement":
      return {
        event: generateEvent(),
        complication: generateComplication(),
      };
    case "pnj":
      return {
        npc: generateNpc(),
        location: generateLocation(),
      };
    case "complication":
      return {
        complication: generateComplication(),
        rumor: generateRumor(),
      };
    case "complet":
    default:
      return generateImprovisation();
  }
}

export function generateImprovisation(): ImprovisationResult {
  return {
    npc: generateNpc(),
    location: generateLocation(),
    event: generateEvent(),
    rumor: generateRumor(),
    complication: generateComplication(),
  };
}
