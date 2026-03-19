import { useEffect, useMemo, useRef, useState } from "react";

export const CHECKLIST_ITEMS = [
  { id: "first-session", label: "Lancer ma première session", xp: 10 },
  { id: "first-choice", label: "Faire jouer un premier choix", xp: 15 },
  { id: "first-note", label: "Écrire ma première note de scène", xp: 15 },
  { id: "three-sessions", label: "Compléter 3 sessions", xp: 25 },
  { id: "discover-expert", label: "Découvrir le mode Expert", xp: 35 },
];

export type BeginnerChecklistProps = {
  checkedItems: Record<string, boolean>;
  onSwitchToExpert: () => void;
  forceOpenToken?: number;
};

export function BeginnerChecklist({
  checkedItems,
  onSwitchToExpert,
  forceOpenToken,
}: BeginnerChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastForceTokenRef = useRef<number | null>(null);
  const { earnedXp, maxXp, isComplete } = useMemo(() => {
    const earned = CHECKLIST_ITEMS.reduce((sum, item) => {
      return sum + (checkedItems[item.id] ? item.xp : 0);
    }, 0);
    return { earnedXp: earned, maxXp: 100, isComplete: earned >= 100 };
  }, [checkedItems]);

  useEffect(() => {
    if (forceOpenToken === undefined) {
      return;
    }
    if (lastForceTokenRef.current !== forceOpenToken) {
      lastForceTokenRef.current = forceOpenToken;
      setIsCollapsed(false);
    }
  }, [forceOpenToken]);

  return (
    <div
      className="rounded-lg border border-[#c9962a]/60 px-4 py-3 text-sm shadow-sm"
      style={{ background: "rgba(201,150,42,0.08)" }}
    >
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left font-semibold text-[#5a3010]"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        <span>📜 Progression du MJ</span>
        <span className="text-xs">{isCollapsed ? "▼" : "▲"}</span>
      </button>

      {!isCollapsed && (
        <div className="mt-3 space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const checked = checkedItems[item.id];
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-[#c9962a]/40 bg-white/60 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-sm border"
                    style={{
                      borderColor: "#c9962a",
                      color: checked ? "#c9962a" : "transparent",
                      background: checked ? "rgba(201,150,42,0.15)" : "transparent",
                    }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-sm text-stone-700">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-[#8a6010]">
                  {item.xp} XP
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-stone-700">
          <span>Progression</span>
          <span>
            {Math.min(earnedXp, maxXp)} / {maxXp} XP
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#e5d3a6]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, (earnedXp / maxXp) * 100)}%`,
              background: "linear-gradient(160deg, #c9962a, #8a6010)",
              transition: "width 220ms ease",
            }}
          />
        </div>
      </div>

      {isComplete && (
        <div className="mt-4 rounded-md border border-[#c9962a] bg-white/70 p-3 text-center">
          <p className="text-sm font-semibold text-[#5a3010]">
            Tu es prêt pour le mode Expert !
          </p>
          <button
            type="button"
            onClick={onSwitchToExpert}
            className="btn-gold-medieval mt-3 px-4 py-2 text-xs"
          >
            Passer en mode Expert
          </button>
          <div className="relative mt-3 h-6 overflow-hidden">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className="absolute h-2 w-2 rounded-sm"
                style={{
                  left: `${(index * 5) % 90}%`,
                  top: `${(index * 7) % 60}%`,
                  background: index % 2 === 0 ? "#c9962a" : "#8a6010",
                  animation: `confetti-fall 1.6s ease ${
                    (index % 6) * 0.12
                  }s infinite`,
                  opacity: 0.9,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          <style>
            {`@keyframes confetti-fall {
  0% { transform: translateY(-8px) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(26px) rotate(140deg); opacity: 0; }
}`}
          </style>
        </div>
      )}
    </div>
  );
}
