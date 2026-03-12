import { useCallback, useEffect, useRef, useState } from "react";
import { useSceneMapLayout, CELL_SIZE, CELL_GAP } from "../hooks/useSceneMapLayout";

interface Scene {
  id: string;
  title?: string;
  picto?: string;
  liveNotes?: unknown[];
  choices?: Array<{
    id: string; label: string; targetType: string; targetId: string; intent?: string;
  }>;
}

interface SceneMapProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  sessionId: string;
  onSelectScene: (sceneId: string) => void;
  onUpdateScenePicto?: (sceneId: string, picto: string) => void;
}

const PICTO_LIST = [
  { icon: "🌲", label: "Forêt" }, { icon: "🌾", label: "Champ" },
  { icon: "🏘️", label: "Village" }, { icon: "🏙️", label: "Ville" },
  { icon: "🍺", label: "Auberge" }, { icon: "🏰", label: "Château" },
  { icon: "🗼", label: "Tour" }, { icon: "⛪", label: "Temple" },
  { icon: "🕳️", label: "Caverne" }, { icon: "🛤️", label: "Route" },
  { icon: "🌊", label: "Rivière" }, { icon: "⛰️", label: "Montagne" },
  { icon: "🏪", label: "Marché" }, { icon: "⚔️", label: "Combat" },
  { icon: "⛏️", label: "Mine" }, { icon: "⚓", label: "Port" },
  { icon: "📚", label: "Biblio" }, { icon: "⛓️", label: "Prison" },
  { icon: "⛺", label: "Camp" }, { icon: "🌙", label: "Nuit" },
  { icon: "☀️", label: "Jour" }, { icon: "🔥", label: "Danger" },
  { icon: "💀", label: "Mort" }, { icon: "🗝️", label: "Secret" },
  { icon: "📍", label: "Autre" },
];

// Couleurs harmonisées avec le thème parchemin — plus claires et chaudes
function getCellColor(picto: string): { bg: string; border: string } {
  switch (picto) {
    case "🌲": return { bg: "#4a7a30", border: "#7ab850" };
    case "🌾": return { bg: "#a08030", border: "#d0b060" };
    case "🏘️": return { bg: "#b08a58", border: "#d8b888" };
    case "🏙️": return { bg: "#7878a0", border: "#a8a8c8" };
    case "🍺": return { bg: "#a06020", border: "#d09848" };
    case "🏰": return { bg: "#807070", border: "#b0a0a0" };
    case "🗼": return { bg: "#889070", border: "#b8c098" };
    case "⛪": return { bg: "#8888c0", border: "#b8b8e8" };
    case "🕳️": return { bg: "#504030", border: "#806858" };
    case "🛤️": return { bg: "#a08860", border: "#c8b090" };
    case "🌊": return { bg: "#3878a8", border: "#60a8d8" };
    case "⛰️": return { bg: "#909888", border: "#b8c0b0" };
    case "🏪": return { bg: "#a08050", border: "#c8a878" };
    case "⚔️": return { bg: "#a04040", border: "#d07070" };
    case "⛏️": return { bg: "#906868", border: "#b89090" };
    case "⚓": return { bg: "#406090", border: "#70a0c0" };
    case "📚": return { bg: "#906040", border: "#c09070" };
    case "⛓️": return { bg: "#606060", border: "#909090" };
    case "⛺": return { bg: "#708050", border: "#a0b078" };
    case "🌙": return { bg: "#404878", border: "#7080b8" };
    case "☀️": return { bg: "#b09020", border: "#e0c050" };
    case "🔥": return { bg: "#b04020", border: "#e07050" };
    case "💀": return { bg: "#686050", border: "#989080" };
    case "🗝️": return { bg: "#807060", border: "#b0a088" };
    default:   return { bg: "#8a7050", border: "#b09878" };
  }
}

function getAutoPicto(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("forêt") || t.includes("foret") || t.includes("bois")) return "🌲";
  if (t.includes("champ") || t.includes("blé") || t.includes("ferme")) return "🌾";
  if (t.includes("village") || t.includes("hameau") || t.includes("bourg")) return "🏘️";
  if (t.includes("ville") || t.includes("cité") || t.includes("cite")) return "🏙️";
  if (t.includes("auberge") || t.includes("taverne")) return "🍺";
  if (t.includes("château") || t.includes("chateau") || t.includes("forteresse")) return "🏰";
  if (t.includes("tour") || t.includes("rempart")) return "🗼";
  if (t.includes("temple") || t.includes("église") || t.includes("eglise") || t.includes("sanctuaire")) return "⛪";
  if (t.includes("caverne") || t.includes("grotte") || t.includes("crypte")) return "🕳️";
  if (t.includes("route") || t.includes("chemin") || t.includes("carrefour")) return "🛤️";
  if (t.includes("rivière") || t.includes("riviere") || t.includes("fleuve") || t.includes("lac") || t.includes("pont")) return "🌊";
  if (t.includes("montagne") || t.includes("col") || t.includes("sommet")) return "⛰️";
  if (t.includes("marché") || t.includes("marchand")) return "🏪";
  if (t.includes("combat") || t.includes("bataille")) return "⚔️";
  if (t.includes("mine")) return "⛏️";
  if (t.includes("port") || t.includes("quai") || t.includes("navire")) return "⚓";
  if (t.includes("camp") || t.includes("campement")) return "⛺";
  return "📍";
}

export function SceneMap({ scenes, selectedSceneId, sessionId, onSelectScene, onUpdateScenePicto }: SceneMapProps) {
  const storageKey = `mj-scene-map-${sessionId}`;
  const visitedKey = `mj-scene-visited-${sessionId}`;

  const [gridOverrides, setGridOverrides] = useState<Record<string, { col: number; row: number }>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "{}"); } catch { return {}; }
  });
  const [visitedSceneIds, setVisitedSceneIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(visitedKey) ?? "[]")); } catch { return new Set(); }
  });
  const [pictoMenuSceneId, setPictoMenuSceneId] = useState<string | null>(null);
  const [pictoMenuPos, setPictoMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!selectedSceneId) return;
    setVisitedSceneIds((prev) => {
      if (prev.has(selectedSceneId)) return prev;
      const next = new Set(prev);
      next.add(selectedSceneId);
      try { localStorage.setItem(visitedKey, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }, [selectedSceneId, visitedKey]);

  const { nodes, edges } = useSceneMapLayout(scenes, selectedSceneId, visitedSceneIds, gridOverrides);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; origCol: number; origRow: number } | null>(null);
  const hadDraggedRef = useRef(false);
  // FIX picto : on track si un picto-tap est en cours pour ignorer le onClick du g
  const pictoTapRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string, col: number, row: number) => {
    e.preventDefault(); e.stopPropagation();
    hadDraggedRef.current = false;
    draggingRef.current = { id: nodeId, startX: e.clientX, startY: e.clientY, origCol: col, origRow: row };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, nodeId: string, col: number, row: number) => {
    e.stopPropagation();
    const t = e.touches[0];
    hadDraggedRef.current = false;
    draggingRef.current = { id: nodeId, startX: t.clientX, startY: t.clientY, origCol: col, origRow: row };
  }, []);

  useEffect(() => {
    const step = CELL_SIZE + CELL_GAP;
    const onMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const dx = clientX - draggingRef.current.startX;
      const dy = clientY - draggingRef.current.startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) hadDraggedRef.current = true;
      const { id, origCol, origRow } = draggingRef.current;
      const newCol = Math.max(0, origCol + Math.round(dx / step));
      const newRow = Math.max(0, origRow + Math.round(dy / step));
      setGridOverrides((prev) => ({ ...prev, [id]: { col: newCol, row: newRow } }));
    };
    const onEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = null;
      setGridOverrides((prev) => {
        try { localStorage.setItem(storageKey, JSON.stringify(prev)); } catch {}
        return prev;
      });
      setTimeout(() => { hadDraggedRef.current = false; }, 80);
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [storageKey]);

  function handleReset() {
    setGridOverrides({});
    try { localStorage.removeItem(storageKey); } catch {}
  }

  // FIX décalage : PADDING = 8, les cases s'alignent exactement sur la grille
  const PADDING = 8;
  const step = CELL_SIZE + CELL_GAP;
  const maxCol = Math.max(...nodes.map((n) => n.col), 4) + 2;
  const maxRow = Math.max(...nodes.map((n) => n.row), 3) + 2;
  const svgW = maxCol * step + PADDING * 2;
  const svgH = maxRow * step + PADDING * 2;

  // Centre d'une case — aligné avec le pattern
  function cellCenter(col: number, row: number) {
    return {
      x: PADDING + col * step + CELL_SIZE / 2,
      y: PADDING + row * step + CELL_SIZE / 2,
    };
  }

  // Coin haut-gauche d'une case
  function cellOrigin(col: number, row: number) {
    return {
      x: PADDING + col * step,
      y: PADDING + row * step,
    };
  }

  if (scenes.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px", color: "#7a5c2a", fontFamily: "'Cinzel', serif", fontSize: "0.8rem", textAlign: "center" }}>
        Aucune scène dans cette session.
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Barre contrôle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", padding: "4px 6px", background: "rgba(139,94,42,0.15)", borderRadius: "6px", border: "1px solid rgba(139,94,42,0.3)" }}>
        <span style={{ fontSize: "0.6rem", color: "#8b6914", fontStyle: "italic", fontFamily: "'Cinzel', serif" }}>
          Glisser · Tap icône pour changer
        </span>
        <button type="button" onClick={handleReset}
          style={{ fontSize: "0.6rem", padding: "2px 6px", background: "rgba(139,94,42,0.2)", border: "1px solid rgba(139,94,42,0.4)", borderRadius: "4px", color: "#c9962a", cursor: "pointer", fontFamily: "'Cinzel', serif" }}>
          Réinit.
        </button>
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
        {[{ color: "#c9962a", label: "Active" }, { color: "#7aaa50", label: "Visitée" }, { color: "#8a7050", label: "Non visitée" }].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, border: "1px solid rgba(201,150,42,0.4)" }} />
            <span style={{ fontSize: "0.55rem", color: "#7a5c2a", fontFamily: "'Cinzel', serif" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG grille */}
      <div ref={containerRef} style={{ overflowX: "auto", overflowY: "auto", maxHeight: "280px", borderRadius: "8px", border: "1px solid rgba(139,94,42,0.4)" }}>
        <svg width={svgW} height={svgH} style={{ display: "block" }}>
          <defs>
            {/* FIX : le pattern commence exactement à PADDING pour s'aligner avec les cases */}
            <pattern id="dofusGrid" patternUnits="userSpaceOnUse" width={step} height={step} x={PADDING} y={PADDING}>
              <rect width={step} height={step} fill="#e8d5a8" />
              <rect x="2" y="2" width={step - 4} height={step - 4} fill="#ddc88a" rx="2" />
            </pattern>
          </defs>

          {/* Fond parchemin clair — harmonisé avec la page */}
            <rect width={svgW} height={svgH} fill="#efe2c2" />
            <rect width={svgW} height={svgH} fill="url(#dofusGrid)" opacity="0.85" />

          {/* Connexions pointillées */}
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const from = cellCenter(fromNode.col, fromNode.row);
            const to = cellCenter(toNode.col, toNode.row);
            return (
              <line key={`edge-${i}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="rgba(139,94,42,0.7)" strokeWidth="2" strokeDasharray="5 3"
              />
            );
          })}

          {/* Cases des scènes */}
          {nodes.map((node) => {
            const sceneData = scenes.find((s) => s.id === node.id);
            const picto = sceneData?.picto || getAutoPicto(node.title);
            const colors = getCellColor(picto);
            const { x: px, y: py } = cellOrigin(node.col, node.row);
            const center = cellCenter(node.col, node.row);

            let borderColor = colors.border;
            let borderWidth = 2;
            if (node.isActive) { borderColor = "#c9962a"; borderWidth = 3; }
            else if (node.isVisited) { borderColor = "#7aaa50"; borderWidth = 2; }

            return (
              <g
                key={node.id}
                style={{ cursor: "grab" }}
                onMouseDown={(e) => handleMouseDown(e, node.id, node.col, node.row)}
                onTouchStart={(e) => handleTouchStart(e, node.id, node.col, node.row)}
                onClick={() => {
                  if (hadDraggedRef.current) return;
                  if (pictoTapRef.current) { pictoTapRef.current = false; return; }
                  onSelectScene(node.id);
                }}
              >
                {/* Ombre */}
                <rect x={px + 2} y={py + 2} width={CELL_SIZE} height={CELL_SIZE} rx="4" fill="rgba(0,0,0,0.25)" />

                {/* Halo actif */}
                {node.isActive && (
                  <rect x={px - 3} y={py - 3} width={CELL_SIZE + 6} height={CELL_SIZE + 6} rx="7" fill="rgba(201,150,42,0.25)" />
                )}
{selectedSceneId === node.id && (
  <circle
    cx={px + CELL_SIZE / 2}
    cy={py + CELL_SIZE / 2}
    r={CELL_SIZE / 2 + 6}
    fill="none"
    stroke="#ffcc55"
    strokeWidth="3"
    style={{
      filter: "drop-shadow(0 0 6px rgba(255,204,85,0.8))",
      animation: "sceneMarker 1.5s ease-in-out infinite"
    }}
  />
)}
                {/* Case */}
                <rect x={px} y={py} width={CELL_SIZE} height={CELL_SIZE} rx="4"
                  fill={colors.bg} stroke={borderColor} strokeWidth={borderWidth} />

                {/* Reflet haut */}
                <rect x={px + 2} y={py + 2} width={CELL_SIZE - 4} height={12} rx="3" fill="rgba(255,255,255,0.15)" />

                {/* Pictogramme — FIX : onMouseUp au lieu de onClick pour éviter le conflit */}
                <text
                  x={center.x}
                   y={py + CELL_SIZE / 2 + 2}
                    textAnchor="middle"
                    fontSize="20"
                 style={{
                  pointerEvents: "all",
                  cursor: "pointer",
                  userSelect: "none"
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                      pictoTapRef.current = true

    const containerRect = containerRef.current?.getBoundingClientRect()

                     setPictoMenuPos({
                       x: (containerRect?.left ?? 0) + px + CELL_SIZE / 2 - 110,
                      y: (containerRect?.bottom ?? 0) + 8
                      })

                     setPictoMenuSceneId((prev) =>
                       prev === node.id ? null : node.id
                        )
                      }}
>
  {picto}
</text>

                {/* Titre */}
                <foreignObject x={px + 2} y={py + CELL_SIZE / 2 + 8} width={CELL_SIZE - 4} height={CELL_SIZE / 2 - 10}>
                  <div style={{
                    fontSize: "7px", fontFamily: "'Cinzel', serif",
                    fontWeight: node.isActive ? "700" : "600",
                    color: "#fff",
                    textAlign: "center", lineHeight: "1.2",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    wordBreak: "break-word",
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  }}>
                    {node.title}
                  </div>
                </foreignObject>

                {/* Point note */}
                {node.hasNotes && (
                  <circle cx={px + CELL_SIZE - 5} cy={py + 5} r="4" fill="#c9962a" stroke="#fff" strokeWidth="1" />
                )}

                {/* Pulse actif */}
                {node.isActive && (
                  <rect x={px - 2} y={py - 2} width={CELL_SIZE + 4} height={CELL_SIZE + 4} rx="6"
                    fill="none" stroke="#c9962a" strokeWidth="2" opacity="0.8"
                    style={{ animation: "dofusPulse 2s ease infinite" }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Menu pictogramme */}
      {pictoMenuSceneId && (
        <div style={{
          position: "fixed",
          top: Math.min(pictoMenuPos.y, window.innerHeight - 240),
          left: Math.max(10, Math.min(pictoMenuPos.x, window.innerWidth - 240)),
          zIndex: 9999,
          backgroundColor: "#faf3e0",
          border: "2px solid #c9962a",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          width: "230px",
        }}>
          <p style={{ fontSize: "0.65rem", color: "#2c1a08", fontFamily: "'Cinzel', serif", margin: "0 0 8px", textAlign: "center", fontWeight: "600" }}>
            Choisir un pictogramme
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {PICTO_LIST.map(({ icon, label }) => {
              const c = getCellColor(icon);
              return (
                <button key={icon} type="button" title={label}
                  onClick={() => {
                    if (onUpdateScenePicto) onUpdateScenePicto(pictoMenuSceneId, icon);
                    setPictoMenuSceneId(null);
                  }}
                  style={{
                    width: "34px", height: "34px", fontSize: "18px",
                    background: c.bg, border: `2px solid ${c.border}`,
                    borderRadius: "4px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {icon}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setPictoMenuSceneId(null)}
            style={{ marginTop: "8px", width: "100%", fontSize: "0.65rem", padding: "5px", background: "rgba(122,26,26,0.1)", border: "1px solid rgba(122,26,26,0.4)", borderRadius: "4px", color: "#8b1a1a", cursor: "pointer", fontFamily: "'Cinzel', serif" }}>
            Annuler
          </button>
        </div>
      )}

      <style>{`
        @keyframes dofusPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
