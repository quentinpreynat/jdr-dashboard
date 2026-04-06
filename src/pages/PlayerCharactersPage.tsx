import { useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { CharacterCard } from "../components/characters/CharacterCard";
import { createDefaultHeroQuestData } from "../components/characters/sheets/HeroQuestSheet";

export function PlayerCharactersPage() {
  const {
    data,
    createPlayerCharacter,
    updatePlayerCharacter,
    deletePlayerCharacter,
  } = useAppData();

  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);
  const pcs = data.pcs ?? [];

  const handleCreate = () => {
    const newId = createPlayerCharacter();
    updatePlayerCharacter(newId, {
      system: "heroquest",
      heroQuestData: createDefaultHeroQuestData("custom"),
    });
    setSelectedPcId(newId);
  };

  return (
    <section
      className="space-y-6 p-6"
      style={{
        background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
        border: "2px solid #8b5e2a",
        borderRadius: "2px 12px 2px 12px",
        boxShadow: "4px 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b-2 border-[#8b5e2a] pb-4">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Uncial Antiqua', serif", color: "#1e1005" }}
        >
          🧝 Personnages Joueurs
        </h2>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md border-2 border-[#8b5e2a] bg-[#fdf6e3] px-4 py-2 text-sm font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          + Nouveau PJ
        </button>
      </div>

      {/* Empty state */}
      {pcs.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[#c9962a]/50 p-8 text-center">
          <p className="text-2xl mb-2">🧝</p>
          <p className="text-sm font-medium text-[#5a3010]" style={{ fontFamily: "'Cinzel', serif" }}>
            Aucun personnage joueur
          </p>
          <p className="text-xs text-stone-600 mt-1">
            Clique sur "+ Nouveau PJ" pour créer le premier héros de ta campagne.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-4 rounded-lg border-2 border-[#c9962a] px-6 py-2 text-sm font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Créer un personnage
          </button>
        </div>
      )}

      {/* Liste des PJ */}
      <div className="space-y-4">
        {pcs.map((pc) => {
          const isSelected = selectedPcId === pc.id;
          const heroEmoji =
            pc.heroQuestData?.heroType === "barbarian" ? "⚔️" :
            pc.heroQuestData?.heroType === "dwarf"     ? "🪓" :
            pc.heroQuestData?.heroType === "elf"       ? "🏹" :
            pc.heroQuestData?.heroType === "wizard"    ? "🔮" : "🧝";

          return (
            <div
              key={pc.id}
              className="rounded-xl border-2 overflow-hidden transition-all"
              style={{
                borderColor: isSelected ? "#c9962a" : "#8b5e2a",
                background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
                boxShadow: isSelected
                  ? "0 4px 20px rgba(201,150,42,0.25)"
                  : "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* En-tête cliquable */}
              <button
                type="button"
                onClick={() => setSelectedPcId(isSelected ? null : pc.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{heroEmoji}</span>
                  <div>
                    <p
                      className="font-semibold text-[#2c1a06] text-base"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {pc.name || "Nouveau PJ"}
                    </p>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {pc.role || (pc.heroQuestData
                        ? `HeroQuest — ${
                            pc.heroQuestData.heroType === "barbarian" ? "Barbare" :
                            pc.heroQuestData.heroType === "dwarf"     ? "Nain" :
                            pc.heroQuestData.heroType === "elf"       ? "Elfe" :
                            pc.heroQuestData.heroType === "wizard"    ? "Magicien" :
                            "Personnalisé"
                          }`
                        : "Sans rôle")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {pc.heroQuestData && (
                    <div className="flex gap-3 text-xs text-stone-600">
                      <span>❤️ {pc.heroQuestData.bodyPoints}/{pc.heroQuestData.bodyPointsMax}</span>
                      <span>🧠 {pc.heroQuestData.mindPoints}/{pc.heroQuestData.mindPointsMax}</span>
                      <span>⚔️ {pc.heroQuestData.attackDice}🎲</span>
                    </div>
                  )}
                  <span
                    className="text-[#8a6010] text-xs font-semibold"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {isSelected ? "▲ Réduire" : "▼ Modifier"}
                  </span>
                </div>
              </button>

              {/* Fiche complète dépliable */}
              {isSelected && (
                <div className="border-t border-[#c9962a]/30">

                  {/* Nom + rôle + système */}
                  <div className="flex flex-wrap gap-2 px-5 pt-4">
                    <input
                      value={pc.name}
                      onChange={(e) => updatePlayerCharacter(pc.id, { name: e.target.value })}
                      className="flex-1 min-w-[140px] rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
                      placeholder="Nom du PJ"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    />
                    <input
                      value={pc.role}
                      onChange={(e) => updatePlayerCharacter(pc.id, { role: e.target.value })}
                      className="flex-1 min-w-[140px] rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
                      placeholder="Classe / rôle du joueur"
                    />
                    <select
                      value={pc.system ?? "heroquest"}
                      onChange={(e) =>
                        updatePlayerCharacter(pc.id, {
                          system: e.target.value as "heroquest" | "oneRing" | "dnd",
                          heroQuestData:
                            e.target.value === "heroquest"
                              ? (pc.heroQuestData ?? createDefaultHeroQuestData())
                              : pc.heroQuestData,
                        })
                      }
                      className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-[#c9962a]"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <option value="heroquest">⚔️ HeroQuest</option>
                      <option value="oneRing" disabled>💍 Anneau Unique (bientôt)</option>
                      <option value="dnd" disabled>🐉 D&D 5e (bientôt)</option>
                    </select>
                  </div>

                  {/* Fiche système complète */}
                  <CharacterCard
                    pc={pc}
                    mode="full"
                    onUpdate={(fields) => updatePlayerCharacter(pc.id, fields)}
                  />

                  {/* Supprimer */}
                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Supprimer ${pc.name || "ce PJ"} définitivement ?`)) return;
                        deletePlayerCharacter(pc.id);
                        if (selectedPcId === pc.id) setSelectedPcId(null);
                      }}
                      className="rounded-md border border-red-300 bg-white/70 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🗑️ Supprimer ce personnage
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
