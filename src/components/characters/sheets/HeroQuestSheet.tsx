import { useState } from "react";
import type { HeroQuestData } from "../../../types/systems/heroquest";
import {
  HEROQUEST_DEFAULTS,
} from "../../../types/systems/heroquest";
import {
  rollHeroQuestDice,
  formatDiceRoll,
} from "../../../lib/dice/heroquestDice";

// ─── Styles partagés ────────────────────────────────────────────────────────

const PARCHMENT = {
  background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
  border: "2px solid #c9962a",
  borderRadius: "10px",
  fontFamily: "'Cinzel', serif",
} as const;

const STAT_BOX = "flex flex-col items-center justify-center rounded-lg border-2 border-[#c9962a]/60 bg-white/70 px-3 py-2 min-w-[64px]";

// ─── Sous-composant : boîte de stat avec +/- ─────────────────────────────────

function StatBox({
  label,
  value,
  max,
  color,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  onDecrement?: () => void;
  onIncrement?: () => void;
}) {
  return (
    <div className={STAT_BOX}>
      <span className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#8a6010" }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {onDecrement && (
          <button
            type="button"
            onClick={onDecrement}
            className="w-5 h-5 rounded-full border border-[#c9962a] text-xs font-bold text-[#5a3010] hover:bg-[#ead59a] flex items-center justify-center transition-colors"
          >−</button>
        )}
        <span className="text-xl font-bold" style={{ color, minWidth: "1.5rem", textAlign: "center" }}>
          {value}
        </span>
        {onIncrement && (
          <button
            type="button"
            onClick={onIncrement}
            className="w-5 h-5 rounded-full border border-[#c9962a] text-xs font-bold text-[#5a3010] hover:bg-[#ead59a] flex items-center justify-center transition-colors"
          >+</button>
        )}
      </div>
      {max !== undefined && (
        <span className="text-[10px] text-stone-500 mt-0.5">/ {max}</span>
      )}
    </div>
  );
}

// ─── Vue compacte LIVE ────────────────────────────────────────────────────────

interface HeroQuestLiveViewProps {
  data: HeroQuestData;
  pcName: string;
  onUpdate: (fields: Partial<HeroQuestData>) => void;
}

export function HeroQuestLiveView({ data, pcName, onUpdate }: HeroQuestLiveViewProps) {
  const [lastRoll, setLastRoll] = useState<string | null>(null);

  const handleRollAttack = () => {
    const result = rollHeroQuestDice(data.attackDice);
    setLastRoll(`⚔️ Attaque (${data.attackDice}🎲) : ${formatDiceRoll(result)}`);
  };

  const handleRollDefense = () => {
    const result = rollHeroQuestDice(data.defenseDice);
    setLastRoll(`🛡️ Défense (${data.defenseDice}🎲) : ${formatDiceRoll(result)}`);
  };

  const bodyPercent = data.bodyPointsMax > 0
    ? Math.round((data.bodyPoints / data.bodyPointsMax) * 100)
    : 0;
  const bodyColor = bodyPercent > 50 ? "#2d8a4e" : bodyPercent > 25 ? "#c9962a" : "#b91c1c";

  return (
    <div className="space-y-3 p-3" style={{ fontFamily: "'Cinzel', serif" }}>

      {/* Nom du héros */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wide">
            {HERO_TYPE_LABELS[data.heroType] ?? data.heroType}
          </p>
          <p className="text-sm font-bold text-[#2c1a06]">
            {data.heroName || pcName}
          </p>
        </div>
        <span className="text-2xl">{HERO_TYPE_EMOJI[data.heroType] ?? "🧙"}</span>
      </div>

      {/* Stats principales */}
      <div className="flex gap-2 flex-wrap">
        <StatBox
          label="Body"
          value={data.bodyPoints}
          max={data.bodyPointsMax}
          color={bodyColor}
          onDecrement={() => onUpdate({ bodyPoints: Math.max(0, data.bodyPoints - 1) })}
          onIncrement={() => onUpdate({ bodyPoints: Math.min(data.bodyPointsMax, data.bodyPoints + 1) })}
        />
        <StatBox
          label="Mind"
          value={data.mindPoints}
          max={data.mindPointsMax}
          color="#5a3010"
          onDecrement={() => onUpdate({ mindPoints: Math.max(0, data.mindPoints - 1) })}
          onIncrement={() => onUpdate({ mindPoints: Math.min(data.mindPointsMax, data.mindPoints + 1) })}
        />
        <StatBox label="ATK 🎲" value={data.attackDice} color="#8a6010" />
        <StatBox label="DEF 🛡️" value={data.defenseDice} color="#5a6080" />
      </div>

      {/* Barre de vie */}
      <div>
        <div className="flex justify-between text-[10px] text-stone-500 mb-1">
          <span>Body Points</span>
          <span>{data.bodyPoints} / {data.bodyPointsMax}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${bodyPercent}%`,
              background: bodyColor,
            }}
          />
        </div>
      </div>

      {/* Boutons de jets */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRollAttack}
          className="flex-1 rounded-lg border-2 border-[#c9962a] py-2 text-xs font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
        >
          ⚔️ Attaque
        </button>
        <button
          type="button"
          onClick={handleRollDefense}
          className="flex-1 rounded-lg border-2 border-[#c9962a] py-2 text-xs font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
        >
          🛡️ Défense
        </button>
      </div>

      {/* Résultat du jet */}
      {lastRoll && (
        <div
          className="rounded-lg px-3 py-2 text-xs text-[#2c1a06]"
          style={{ background: "rgba(201,150,42,0.12)", border: "1px solid rgba(201,150,42,0.3)", fontFamily: "'Crimson Text', serif", fontSize: "0.85rem" }}
        >
          {lastRoll}
          <button
            type="button"
            onClick={() => setLastRoll(null)}
            className="ml-2 text-stone-400 hover:text-stone-600"
          >✕</button>
        </div>
      )}

      {/* Équipement compact */}
      {(data.weapon || data.armor) && (
        <div className="text-xs text-stone-600 space-y-0.5">
          {data.weapon && <p>⚔️ {data.weapon}</p>}
          {data.armor && <p>🛡️ {data.armor}</p>}
        </div>
      )}

      {/* Objets */}
      {data.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.equipment.map((item, i) => (
            <span
              key={i}
              className="rounded-full border border-[#c9962a]/50 bg-white/60 px-2 py-0.5 text-[10px] text-stone-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fiche complète HORS LIVE ─────────────────────────────────────────────────

interface HeroQuestSheetProps {
  data: HeroQuestData;
  pcName: string;
  onUpdate: (fields: Partial<HeroQuestData>) => void;
}

export function HeroQuestSheet({ data, pcName, onUpdate }: HeroQuestSheetProps) {
  const [newEquipItem, setNewEquipItem] = useState("");
  const [diceResult, setDiceResult] = useState<string | null>(null);

  const handleHeroTypeChange = (heroType: HeroQuestData["heroType"]) => {
    const defaults = HEROQUEST_DEFAULTS[heroType];
    onUpdate({
      heroType,
      ...defaults,
      bodyPoints: defaults.bodyPointsMax ?? data.bodyPoints,
      mindPoints: defaults.mindPointsMax ?? data.mindPoints,
    });
  };

  const handleAddEquipment = () => {
    const trimmed = newEquipItem.trim();
    if (!trimmed) return;
    onUpdate({ equipment: [...data.equipment, trimmed] });
    setNewEquipItem("");
  };

  const handleRemoveEquipment = (index: number) => {
    onUpdate({ equipment: data.equipment.filter((_, i) => i !== index) });
  };

  const handleRollAttack = () => {
    const result = rollHeroQuestDice(data.attackDice);
    setDiceResult(`⚔️ Attaque (${data.attackDice} dés) : ${formatDiceRoll(result)} — ${result.skulls} crâne${result.skulls > 1 ? "s" : ""}`);
  };

  const handleRollDefense = () => {
    const result = rollHeroQuestDice(data.defenseDice);
    const shields = result.whiteShields + result.blackShields;
    setDiceResult(`🛡️ Défense (${data.defenseDice} dés) : ${formatDiceRoll(result)} — ${shields} bouclier${shields > 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-5 p-1" style={{ fontFamily: "'Cinzel', serif" }}>

      {/* ── Type de héros ── */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={PARCHMENT}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8a6010" }}>
          🧙 Héros
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Nom du héros</span>
            <input
              value={data.heroName}
              onChange={(e) => onUpdate({ heroName: e.target.value })}
              placeholder={pcName}
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Classe</span>
            <select
              value={data.heroType}
              onChange={(e) => handleHeroTypeChange(e.target.value as HeroQuestData["heroType"])}
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            >
              <option value="barbarian">⚔️ Barbare</option>
              <option value="dwarf">🪓 Nain</option>
              <option value="elf">🏹 Elfe</option>
              <option value="wizard">🔮 Magicien</option>
              <option value="custom">✨ Personnalisé</option>
            </select>
          </label>
        </div>
      </div>

      {/* ── Points de Body & Mind ── */}
      <div className="rounded-xl p-4 space-y-3" style={PARCHMENT}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8a6010" }}>
          ❤️ Points de vie & esprit
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Body */}
          <div className="space-y-2">
            <p className="text-xs text-stone-600">Body Points</p>
            <div className="flex items-center gap-2">
              <NumberInput
                value={data.bodyPoints}
                min={0}
                max={data.bodyPointsMax}
                onChange={(v) => onUpdate({ bodyPoints: v })}
                label="Actuel"
              />
              <span className="text-stone-400">/</span>
              <NumberInput
                value={data.bodyPointsMax}
                min={1}
                max={20}
                onChange={(v) => onUpdate({ bodyPointsMax: v, bodyPoints: Math.min(data.bodyPoints, v) })}
                label="Max"
              />
            </div>
          </div>
          {/* Mind */}
          <div className="space-y-2">
            <p className="text-xs text-stone-600">Mind Points</p>
            <div className="flex items-center gap-2">
              <NumberInput
                value={data.mindPoints}
                min={0}
                max={data.mindPointsMax}
                onChange={(v) => onUpdate({ mindPoints: v })}
                label="Actuel"
              />
              <span className="text-stone-400">/</span>
              <NumberInput
                value={data.mindPointsMax}
                min={1}
                max={20}
                onChange={(v) => onUpdate({ mindPointsMax: v, mindPoints: Math.min(data.mindPoints, v) })}
                label="Max"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Dés de combat ── */}
      <div className="rounded-xl p-4 space-y-3" style={PARCHMENT}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8a6010" }}>
          🎲 Dés de combat
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-stone-600">Dés d'attaque</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ attackDice: Math.max(1, data.attackDice - 1) })}
                className="w-7 h-7 rounded-full border border-[#c9962a] font-bold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
              >−</button>
              <span className="text-2xl font-bold text-[#5a3010] w-8 text-center">{data.attackDice}</span>
              <button
                type="button"
                onClick={() => onUpdate({ attackDice: Math.min(9, data.attackDice + 1) })}
                className="w-7 h-7 rounded-full border border-[#c9962a] font-bold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
              >+</button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-stone-600">Dés de défense</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ defenseDice: Math.max(1, data.defenseDice - 1) })}
                className="w-7 h-7 rounded-full border border-[#c9962a] font-bold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
              >−</button>
              <span className="text-2xl font-bold text-[#5a3010] w-8 text-center">{data.defenseDice}</span>
              <button
                type="button"
                onClick={() => onUpdate({ defenseDice: Math.min(9, data.defenseDice + 1) })}
                className="w-7 h-7 rounded-full border border-[#c9962a] font-bold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
              >+</button>
            </div>
          </div>
        </div>

        {/* Boutons de jets de dés */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleRollAttack}
            className="flex-1 rounded-lg border-2 border-[#c9962a] py-2 text-xs font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
          >
            🎲 Tester l'attaque
          </button>
          <button
            type="button"
            onClick={handleRollDefense}
            className="flex-1 rounded-lg border-2 border-[#c9962a] py-2 text-xs font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
          >
            🎲 Tester la défense
          </button>
        </div>

        {diceResult && (
          <div
            className="rounded-lg px-3 py-2 text-sm text-[#2c1a06]"
            style={{ background: "rgba(201,150,42,0.12)", border: "1px solid rgba(201,150,42,0.3)", fontFamily: "'Crimson Text', serif" }}
          >
            {diceResult}
            <button type="button" onClick={() => setDiceResult(null)} className="ml-2 text-stone-400">✕</button>
          </div>
        )}
      </div>

      {/* ── Équipement ── */}
      <div className="rounded-xl p-4 space-y-3" style={PARCHMENT}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8a6010" }}>
          🎒 Équipement
        </p>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Arme</span>
            <input
              value={data.weapon}
              onChange={(e) => onUpdate({ weapon: e.target.value })}
              placeholder="Ex: Épée large"
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Armure</span>
            <input
              value={data.armor}
              onChange={(e) => onUpdate({ armor: e.target.value })}
              placeholder="Ex: Cotte de mailles"
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Or 💰</span>
            <input
              type="number"
              min={0}
              value={data.gold}
              onChange={(e) => onUpdate({ gold: Math.max(0, parseInt(e.target.value) || 0) })}
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-stone-600">Mouvement</span>
            <input
              type="number"
              min={1}
              max={24}
              value={data.movement}
              onChange={(e) => onUpdate({ movement: Math.max(1, parseInt(e.target.value) || 1) })}
              className="rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
          </label>
        </div>

        {/* Objets divers */}
        <div className="space-y-2">
          <p className="text-xs text-stone-600">Objets</p>
          <div className="flex gap-2">
            <input
              value={newEquipItem}
              onChange={(e) => setNewEquipItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEquipment()}
              placeholder="Ajouter un objet..."
              className="flex-1 rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-1.5 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a]"
            />
            <button
              type="button"
              onClick={handleAddEquipment}
              className="rounded-md border-2 border-[#c9962a] px-3 py-1.5 text-xs font-semibold text-[#5a3010] hover:bg-[#ead59a] transition-colors"
            >
              + Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.equipment.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-[#c9962a]/50 bg-white/70 px-2.5 py-1 text-xs text-stone-700"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(i)}
                  className="text-stone-400 hover:text-red-500 transition-colors ml-1"
                >
                  ✕
                </button>
              </span>
            ))}
            {data.equipment.length === 0 && (
              <p className="text-xs text-stone-400 italic">Aucun objet pour le moment.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="rounded-xl p-4 space-y-2" style={PARCHMENT}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8a6010" }}>
          📜 Notes
        </p>
        <textarea
          rows={3}
          value={data.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Notes sur ce héros..."
          className="w-full rounded-md border border-[#c9962a]/50 bg-white/80 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#c9962a] resize-none"
          style={{ fontFamily: "'Crimson Text', serif" }}
        />
      </div>
    </div>
  );
}

// ─── Helper : input numérique compact ────────────────────────────────────────

function NumberInput({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-14 rounded-md border border-[#c9962a]/50 bg-white/80 px-2 py-1 text-center text-sm font-bold text-stone-800 focus:outline-none focus:border-[#c9962a]"
      />
      <span className="text-[9px] text-stone-400">{label}</span>
    </div>
  );
}

// ─── Constantes d'affichage ───────────────────────────────────────────────────

const HERO_TYPE_LABELS: Record<HeroQuestData["heroType"], string> = {
  barbarian: "Barbare",
  dwarf:     "Nain",
  elf:       "Elfe",
  wizard:    "Magicien",
  custom:    "Héros personnalisé",
};

const HERO_TYPE_EMOJI: Record<HeroQuestData["heroType"], string> = {
  barbarian: "⚔️",
  dwarf:     "🪓",
  elf:       "🏹",
  wizard:    "🔮",
  custom:    "✨",
};

// ─── Valeurs par défaut pour un nouveau personnage ────────────────────────────

export function createDefaultHeroQuestData(
  heroType: HeroQuestData["heroType"] = "custom",
): HeroQuestData {
  const defaults = HEROQUEST_DEFAULTS[heroType];
  return {
    heroType,
    heroName:        "",
    bodyPoints:      defaults.bodyPointsMax ?? 6,
    bodyPointsMax:   defaults.bodyPointsMax ?? 6,
    mindPoints:      defaults.mindPointsMax ?? 4,
    mindPointsMax:   defaults.mindPointsMax ?? 4,
    attackDice:      defaults.attackDice    ?? 2,
    defenseDice:     defaults.defenseDice   ?? 2,
    movement:        defaults.movement      ?? 10,
    weapon:          defaults.weapon        ?? "",
    armor:           defaults.armor         ?? "",
    equipment:       [],
    gold:            0,
    notes:           "",
  };
}
