import type { HeroQuestDieFace } from "../../types/systems/heroquest";
import { HEROQUEST_DIE_FACES } from "../../types/systems/heroquest";

export interface HeroQuestDiceResult {
  rolls: HeroQuestDieFace[];
  skulls: number;
  whiteShields: number;
  blackShields: number;
}

/** Lance n dés HeroQuest et retourne le détail */
export function rollHeroQuestDice(count: number): HeroQuestDiceResult {
  const rolls: HeroQuestDieFace[] = Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * HEROQUEST_DIE_FACES.length);
    return HEROQUEST_DIE_FACES[index];
  });

  return {
    rolls,
    skulls:       rolls.filter((f) => f === "skull").length,
    whiteShields: rolls.filter((f) => f === "white_shield").length,
    blackShields: rolls.filter((f) => f === "black_shield").length,
  };
}

/**
 * Résout un combat HeroQuest :
 * - attaquant lance ses dés (crânes = dégâts)
 * - défenseur lance ses dés (boucliers blancs bloquent crânes,
 *   boucliers noirs bloquent aussi bien crânes)
 * Retourne les dégâts nets infligés
 */
export interface HeroQuestCombatResult {
  attack: HeroQuestDiceResult;
  defense: HeroQuestDiceResult;
  damage: number; // dégâts nets (crânes - boucliers)
  description: string;
}

export function resolveCombat(
  attackDice: number,
  defenseDice: number,
): HeroQuestCombatResult {
  const attack = rollHeroQuestDice(attackDice);
  const defense = rollHeroQuestDice(defenseDice);

  const totalShields = defense.whiteShields + defense.blackShields;
  const damage = Math.max(0, attack.skulls - totalShields);

  let description: string;
  if (damage === 0) {
    description = "Attaque bloquée !";
  } else if (damage === 1) {
    description = `${damage} point de Body perdu.`;
  } else {
    description = `${damage} points de Body perdus !`;
  }

  return { attack, defense, damage, description };
}

/** Formate les dés pour l'affichage */
export function formatDiceRoll(result: HeroQuestDiceResult): string {
  const parts: string[] = [];
  if (result.skulls > 0)       parts.push(`💀 ×${result.skulls}`);
  if (result.whiteShields > 0) parts.push(`🛡️ ×${result.whiteShields}`);
  if (result.blackShields > 0) parts.push(`⚫ ×${result.blackShields}`);
  if (parts.length === 0)       parts.push("— Rien");
  return parts.join("  ");
}
