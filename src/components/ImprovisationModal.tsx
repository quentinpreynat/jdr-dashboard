import { useMemo, useState } from "react";
import {
  generateByCategory,
  generateComplication,
  generateEvent,
  generateLocation,
  generateNpc,
  generateRumor,
  type ImprovisationCategory,
} from "../lib/improvisationGenerator";
import type { ImprovisationResult } from "../types/improvisation";

export type ImprovisationModalProps = {
  onClose: () => void;
};

type ResultState = Partial<ImprovisationResult>;

const categories: Array<{ key: ImprovisationCategory; label: string }> = [
  { key: "complet", label: "🎲 Complet" },
  { key: "rebondissement", label: "⚡ Rebondissement" },
  { key: "pnj", label: "🎭 PNJ" },
  { key: "complication", label: "💥 Complication" },
];

const fieldMeta: Array<{
  key: keyof ImprovisationResult;
  label: string;
  icon: string;
}> = [
  { key: "npc", label: "PNJ", icon: "🎭" },
  { key: "location", label: "Lieu", icon: "🏰" },
  { key: "event", label: "Événement", icon: "⚡" },
  { key: "rumor", label: "Rumeur", icon: "🗣️" },
  { key: "complication", label: "Complication", icon: "💥" },
];

function rerollField(
  field: keyof ImprovisationResult,
  current: ResultState,
): ResultState {
  switch (field) {
    case "npc":
      return { ...current, npc: generateNpc() };
    case "location":
      return { ...current, location: generateLocation() };
    case "event":
      return { ...current, event: generateEvent() };
    case "rumor":
      return { ...current, rumor: generateRumor() };
    case "complication":
      return { ...current, complication: generateComplication() };
    default:
      return current;
  }
}

export function ImprovisationModal({ onClose }: ImprovisationModalProps) {
  const [category, setCategory] = useState<ImprovisationCategory>("complet");
  const [result, setResult] = useState<ResultState>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [rollTick, setRollTick] = useState(0);

  const visibleFields = useMemo(() => {
    switch (category) {
      case "rebondissement":
        return fieldMeta.filter(
          (field) => field.key === "event" || field.key === "complication",
        );
      case "pnj":
        return fieldMeta.filter(
          (field) => field.key === "npc" || field.key === "location",
        );
      case "complication":
        return fieldMeta.filter(
          (field) => field.key === "complication" || field.key === "rumor",
        );
      case "complet":
      default:
        return fieldMeta;
    }
  }, [category]);

  const filteredFields = visibleFields.filter(
    (field) => result[field.key] !== undefined && result[field.key] !== null,
  );

  const handleGenerate = () => {
    setIsGenerating(true);
    setRollTick((prev) => prev + 1);
    window.setTimeout(() => {
      setResult(generateByCategory(category));
      window.setTimeout(() => setIsGenerating(false), 180);
    }, 220);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Situation imprévue"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-[6px_18px_6px_18px] border-4 border-[#8a6010] bg-[#1a0f02] p-6 shadow-[0_16px_45px_rgba(0,0,0,0.8)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <h2
            className="text-2xl tracking-[0.08em]"
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              color: "#c9962a",
              textShadow:
                "0 0 12px rgba(201,150,42,0.55), 0 2px 6px rgba(0,0,0,0.7)",
            }}
          >
            ⚔️ Situation Imprévue
          </h2>
          <div className="mt-3 flex items-center justify-center gap-3 text-[#c9962a]">
            <span className="h-px w-20 bg-[#c9962a]/70" />
            <span className="text-sm">✦</span>
            <span className="h-px w-20 bg-[#c9962a]/70" />
          </div>
          <p
            className="mt-3 text-sm text-[#e8d8b0]"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Tirez des éléments pour improviser un rebondissement en plein jeu.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {categories.map((entry) => {
            const active = category === entry.key;
            return (
              <button
                key={entry.key}
                type="button"
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#c9962a] bg-[#c9962a] text-[#2b1606] shadow-[0_6px_12px_rgba(0,0,0,0.4)]"
                    : "border-[#8a6010] bg-[#3d2010] text-[#e7c88a] hover:bg-[#4a2712]"
                }`}
                style={{ fontFamily: "'Cinzel', serif" }}
                onClick={() => setCategory(entry.key)}
              >
                {entry.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredFields.map((field) => (
              <div
                key={`${field.key}-${rollTick}`}
                className={`relative rounded-md border border-[#c9962a]/70 bg-[#3d2010] px-4 py-3 shadow-[inset_0_0_12px_rgba(0,0,0,0.45)] ${
                  isGenerating
                    ? "animate-[gt-shake_150ms_ease-in-out] opacity-80"
                    : "animate-[gt-fade_220ms_ease-out]"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p
                    className="text-xs uppercase tracking-[0.2em] text-[#d8b06a]"
                    style={{ fontFamily: "'Uncial Antiqua', serif" }}
                  >
                    {field.icon} {field.label}
                  </p>
                  <button
                    type="button"
                    className="rounded border border-[#8a6010] bg-[#2c1a08] px-2 py-1 text-xs font-semibold text-[#e6c07a] shadow hover:bg-[#3b210a]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                    onClick={() =>
                      setResult((prev) => rerollField(field.key, prev))
                    }
                    aria-label={`Relancer ${field.label}`}
                    title={`Relancer ${field.label}`}
                  >
                    🔄
                  </button>
                </div>
                <p
                  className="text-sm text-[#f5e6c8]"
                  style={{ fontFamily: "'Crimson Text', serif" }}
                >
                  {result[field.key]}
                </p>
              </div>
            ))}
          </div>

          {filteredFields.length === 0 && (
            <div className="mt-4 rounded-md border border-[#8a6010] bg-[#2c1a08] p-4 text-center text-sm text-[#e7c88a]">
              Cliquez sur Générer pour afficher des propositions.
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 text-white ${
              isGenerating ? "opacity-100" : "opacity-0"
            } transition-opacity`}
          >
            <span
              className={`inline-block text-lg ${
                isGenerating ? "animate-[gt-roll_300ms_linear]" : ""
              }`}
              aria-hidden="true"
            >
              🎲
            </span>
            <span
              className="text-xs uppercase tracking-[0.2em]"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Tirage en cours
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-[#c9962a] bg-[#c9962a] px-4 py-2 text-sm font-semibold text-[#2b1606] shadow hover:bg-[#d9ad3a]"
              style={{ fontFamily: "'Cinzel', serif" }}
              onClick={handleGenerate}
            >
              Générer
            </button>
            <button
              type="button"
              className="rounded-md border border-[#8a6010] bg-transparent px-4 py-2 text-sm font-semibold text-[#e7c88a] shadow hover:bg-[#2c1a08]"
              style={{ fontFamily: "'Cinzel', serif" }}
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      <style>
        {`@keyframes gt-shake {
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-2px) rotate(-0.3deg); }
  50% { transform: translateX(2px) rotate(0.3deg); }
  75% { transform: translateX(-1px) rotate(-0.2deg); }
  100% { transform: translateX(0) rotate(0deg); }
}
@keyframes gt-roll {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes gt-fade {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}`}
      </style>
    </div>
  );
}
