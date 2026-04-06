import type { PlayerCharacter } from "../../models";
import type { HeroQuestData } from "../../types/systems/heroquest";
import { HeroQuestSheet, HeroQuestLiveView, createDefaultHeroQuestData } from "./sheets/HeroQuestSheet";

export type CharacterViewMode = "full" | "live";

interface CharacterCardProps {
  pc: PlayerCharacter;
  mode: CharacterViewMode;
  onUpdate: (fields: Partial<PlayerCharacter>) => void;
}

export function CharacterCard({ pc, mode, onUpdate }: CharacterCardProps) {
  const system = pc.system ?? "heroquest";

  // Helper pour mettre à jour les données spécifiques au système
  const updateSystemData = (fields: Partial<HeroQuestData>) => {
    onUpdate({
      heroQuestData: {
        ...(pc.heroQuestData ?? createDefaultHeroQuestData()),
        ...fields,
      },
    });
  };

  if (system === "heroquest") {
    const data = pc.heroQuestData ?? createDefaultHeroQuestData();

    if (mode === "live") {
      return (
        <HeroQuestLiveView
          data={data}
          pcName={pc.name}
          onUpdate={updateSystemData}
        />
      );
    }

    return (
      <HeroQuestSheet
        data={data}
        pcName={pc.name}
        onUpdate={updateSystemData}
      />
    );
  }

  // Fallback pour les systèmes futurs
  return (
    <div className="p-4 text-sm text-stone-600 italic">
      Système « {system} » non encore supporté.
    </div>
  );
}
