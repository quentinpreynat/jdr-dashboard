import { useCallback, useEffect, useRef, useState } from "react";
import { useSceneMapLayout, NODE_W, NODE_H } from "../hooks/useSceneMapLayout";

// ── Types ────────────────────────────────────────────────────────────────────

interface Scene {
  id: string;
  title?: string;
  picto?: string;
  liveNotes?: unknown[];
  choices?: Array<{
    id: string;
    label: string;
    targetType: string;
    targetId: string;
    intent?: string;
  }>;
}

interface SceneMapProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  sessionId: string;
  onSelectScene: (sceneId: string) => void;
  onClose: () => void;
  onUpdateScenePicto?: (sceneId: string, picto: string) => void;
}

const intentColors: Record<string, string> = {
  talk: "#4a9eff",
  explore: "#4caf50",
  move: "#ff9800",
  attack: "#f44336",
  search: "#9c27b0",
  other: "#8b5e2a",
};

function getIntentColor(intent?: string) {
  return intentColors[intent ?? "other"] ?? intentColors.other;
}

function getIntentLabel(intent?: string) {
  const labels: Record<string, string> = {
    talk: "Parler", explore: "Explorer", move: "Se déplacer",
    attack: "Attaquer", search: "Chercher", other: "Autre",
  };
  return labels[intent ?? "other"] ?? "Autre";
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

function getAutoPictogram(title: string): string {
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

export function SceneMap({
  scenes, selectedSceneId, sessionId,
  onSelectScene, onClose, onUpdateScenePicto,
}: SceneMapProps) {
  const storageKey = `mj-scene-map-${sessionId}`;
  const visitedKey = `mj-scene-visited-${sessionId}`;

  const [overrides, setOverrides] = useState<Record<string, { x: number; y: number }>>(() => {
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

  const { nodes, edges } = useSceneMapLayout(scenes, selectedSceneId, visitedSceneIds, overrides);

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const hadDraggedRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.preventDefault(); e.stopPropagation();
    hadDraggedRef.current = false;
    draggingRef.current = { id: nodeId, startX: e.clientX, startY: e.clientY, origX: nodeX, origY: nodeY };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, nodeId: string, nodeX: number, nodeY: number) => {
    e.stopPropagation();
    const touch = e.touches[0];
    hadDraggedRef.current = false;
    draggingRef.current = { id: nodeId, startX: touch.clientX, startY: touch.clientY, origX: nodeX, origY: nodeY };
  }, []);

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (!draggingRef.current) return;
      const dx = clientX - draggingRef.current.startX;
      const dy = clientY - draggingRef.current.startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) hadDraggedRef.current = true;
      const { id, origX, origY } = draggingRef.current;
      setOverrides((prev) => ({ ...prev, [id]: { x: Math.max(8, origX + dx), y: Math.max(8, origY + dy) } }));
    };
    const onEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = null;
      setOverrides((prev) => {
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

  const padding = 60;
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_W), 600) + padding;
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H), 400) + padding;

  function handleReset() {
    setOverrides({});
    try { localStorage.removeItem(storageKey); } catch {}
  }

  function renderEdge(fromId: string, toId: string, intent: string | undefined, edgeIndex: number) {
    const from = nodes.find((n) => n.id === fromId);
    const to = nodes.find((n) => n.id === toId);
    if (!from || !to) return null;
    const color = getIntentColor(intent);
    const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
    const x2 = to.x + NODE_W / 2, y2 = to.y;
    const midY = (y1 + y2) / 2, midX = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    const labelText = getIntentLabel(intent);
    const labelWidth = labelText.length * 4.5 + 8;
    return (
      <g key={`edge-${fromId}-${toId}-${edgeIndex}`}>
        <defs>
          <marker id={`arrow-${fromId}-${toId}-${edgeIndex}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={color} />
          </marker>
        </defs>
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeOpacity="0.8" markerEnd={`url(#arrow-${fromId}-${toId}-${edgeIndex})`} />
        <rect x={midX - labelWidth / 2} y={midY - 7} width={labelWidth} height={12} rx={3} fill="#fdf3d0" opacity="0.85" />
        <text x={midX} y={midY + 2} textAnchor="middle" fontSize="8" fill={color} opacity="0.9" style={{ fontFamily: "'Cinzel', serif", pointerEvents: "none" }}>
          {labelText}
        </text>
      </g>
    );
  }

  function renderNode(node: typeof nodes[0]) {
    const isActive = node.isActive;
    const isVisited = node.isVisited;
    const sceneData = scenes.find((s) => s.id === node.id);
    const picto = sceneData?.picto || getAutoPictogram(node.title);
    let bgColor = "#fdf3d0", borderColor = "#8b5e2a", borderWidth = 1.5, textColor = "#3d1f00";
    if (isActive) { bgColor = "#c9962a"; borderColor = "#f0c060"; borderWidth = 2; textColor = "#fff"; }
    else if (isVisited) { bgColor = "#e8d08a"; }
    return (
      <g key={node.id} style={{ cursor: "grab" }}
        onMouseDown={(e) => handleMouseDown(e, node.id, node.x, node.y)}
        onTouchStart={(e) => handleTouchStart(e, node.id, node.x, node.y)}
        onClick={() => { if (hadDraggedRef.current) return; onSelectScene(node.id); }}
      >
        <rect x={node.x + 2} y={node.y + 3} width={NODE_W} height={NODE_H} rx="5" fill="rgba(0,0,0,0.2)" />
        <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx="5" fill={bgColor} stroke={borderColor} strokeWidth={borderWidth} />
        <circle cx={node.x + NODE_W / 2} cy={node.y - 2} r="4" fill="#8b1a1a" stroke="#f0a0a0" strokeWidth="1" />
        {/* Pictogramme — tap pour ouvrir sélecteur */}
        <text
          x={node.x + 7} y={node.y + NODE_H / 2 + 4}
          fontSize="11"
          style={{ pointerEvents: "all", cursor: "pointer", userSelect: "none" }}
          onClick={(e) => {
            e.stopPropagation();
            if (hadDraggedRef.current) return;
            const svgRect = svgRef.current?.getBoundingClientRect();
            const panelLeft = 0;
            setPictoMenuPos({
              x: panelLeft + node.x + 10,
              y: (svgRect?.top ?? 0) + node.y + NODE_H + 8,
            });
            setPictoMenuSceneId((prev) => (prev === node.id ? null : node.id));
          }}
        >
          {picto}
        </text>
        {node.hasNotes && <circle cx={node.x + NODE_W - 6} cy={node.y + 6} r="3" fill="#c9962a" stroke="#fff" strokeWidth="1" />}
        <foreignObject x={node.x + 20} y={node.y + 4} width={NODE_W - 24} height={NODE_H - 8}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: "7px",
            fontWeight: isActive ? "700" : "600", color: textColor,
            lineHeight: "1.3", overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical", wordBreak: "break-word",
          }}>
            {node.title}
          </div>
        </foreignObject>
        {isActive && (
          <rect x={node.x - 2} y={node.y - 2} width={NODE_W + 4} height={NODE_H + 4} rx="7"
            fill="none" stroke="#f0c060" strokeWidth="2" opacity="0.6"
            style={{ animation: "pulse-ring 2s ease infinite" }}
          />
        )}
      </g>
    );
  }

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.02); }
          100% { opacity: 0.6; transform: scale(1); }
        }
      `}</style>

      {/* Panneau */}
      <div style={{
        position: "fixed", top: 0, left: 0, height: "100vh", width: "300px",
        zIndex: 46, display: "flex", flexDirection: "column",
        backgroundColor: "#2c1a08", borderRight: "2px solid #8b5e2a",
        boxShadow: "4px 0 24px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          padding: "0.75rem 1rem", backgroundColor: "#2c1a08",
          borderBottom: "1px solid rgba(139,94,42,0.4)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontFamily: "'Uncial Antiqua', serif", fontSize: "1rem", color: "#c9962a", margin: 0 }}>
              🗺️ Carte des scènes
            </h3>
            <p style={{ fontSize: "0.65rem", color: "#8b6914", margin: "2px 0 0", fontStyle: "italic" }}>
              Tap sur l'icône pour changer le pictogramme
            </p>
          </div>
          <button type="button" onClick={handleReset}
            style={{ fontSize: "0.6rem", padding: "3px 7px", background: "rgba(139,94,42,0.2)", border: "1px solid rgba(139,94,42,0.4)", borderRadius: "4px", color: "#c9962a", cursor: "pointer", fontFamily: "'Cinzel', serif" }}
            title="Réinitialiser les positions"
          >
            Réinitialiser
          </button>
        </div>

        {/* Légende */}
        <div style={{ padding: "0.4rem 0.75rem", backgroundColor: "#2c1a08", borderBottom: "1px solid rgba(139,94,42,0.2)", display: "flex", flexWrap: "wrap", gap: "6px", flexShrink: 0 }}>
          {[{ color: "#c9962a", label: "Active" }, { color: "#e8d5a0", label: "Visitée" }, { color: "#fdf6e3", label: "Non visitée" }].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, border: "1px solid #8b5e2a" }} />
              <span style={{ fontSize: "0.6rem", color: "#c9962a", fontFamily: "'Cinzel', serif" }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "2px", width: "100%" }}>
            {Object.entries(intentColors).map(([intent, color]) => (
              <div key={intent} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <div style={{ width: "14px", height: "2px", background: color, borderRadius: "1px" }} />
                <span style={{ fontSize: "0.55rem", color: "#c9962a" }}>{getIntentLabel(intent)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {scenes.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#7a5c2a", fontFamily: "'Cinzel', serif", fontSize: "0.8rem", textAlign: "center", padding: "2rem" }}>
              Aucune scène dans cette session.
            </div>
          ) : (
            <svg ref={svgRef} width={maxX} height={maxY} style={{ display: "block", minWidth: "100%" }}>
              <defs>
                <pattern id="parchmentTexture" patternUnits="userSpaceOnUse" width="4" height="4">
                  <rect width="4" height="4" fill="transparent" />
                  <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(139,94,42,0.08)" strokeWidth="0.5" />
                </pattern>
                <filter id="paper">
                  <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                  <feBlend in="SourceGraphic" mode="multiply" />
                </filter>
              </defs>
              <rect width={maxX} height={maxY} fill="#f5e6c8" filter="url(#paper)" />
              <rect width={maxX} height={maxY} fill="url(#parchmentTexture)" opacity="0.3" />
              {Array.from({ length: Math.ceil(maxX / 40) }).map((_, i) => (
                <line key={`vg-${i}`} x1={i * 40} y1={0} x2={i * 40} y2={maxY} stroke="rgba(139,94,42,0.12)" strokeWidth="1" />
              ))}
              {Array.from({ length: Math.ceil(maxY / 40) }).map((_, i) => (
                <line key={`hg-${i}`} x1={0} y1={i * 40} x2={maxX} y2={i * 40} stroke="rgba(139,94,42,0.12)" strokeWidth="1" />
              ))}
              {edges.map((edge, i) => renderEdge(edge.from, edge.to, edge.intent, i))}
              {nodes.map((node) => renderNode(node))}
            </svg>
          )}
        </div>
      </div>

      {/* Flèche fermeture — seul moyen de fermer */}
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "fixed", top: "50%", left: "300px",
          transform: "translateY(-50%)",
          zIndex: 47, width: "26px", height: "60px",
          backgroundColor: "#2c1a08",
          border: "2px solid #8b5e2a", borderLeft: "none",
          borderRadius: "0 8px 8px 0",
          color: "#c9962a", fontSize: "14px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "3px 0 8px rgba(0,0,0,0.4)",
        }}
        aria-label="Fermer la carte"
      >
        ◀
      </button>

      {/* Menu pictogramme */}
      {pictoMenuSceneId && (
        <div style={{
          position: "fixed",
          top: Math.min(pictoMenuPos.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 230),
          left: 10,
          zIndex: 48,
          backgroundColor: "#2c1a08",
          border: "2px solid #8b5e2a",
          borderRadius: "8px",
          padding: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.7)",
          width: "280px",
        }}>
          <p style={{ fontSize: "0.65rem", color: "#c9962a", fontFamily: "'Cinzel', serif", margin: "0 0 6px", textAlign: "center" }}>
            Choisir un pictogramme
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {PICTO_LIST.map(({ icon, label }) => (
              <button key={icon} type="button" title={label}
                onClick={() => {
                  if (onUpdateScenePicto) onUpdateScenePicto(pictoMenuSceneId, icon);
                  setPictoMenuSceneId(null);
                }}
                style={{
                  width: "36px", height: "36px", fontSize: "18px",
                  background: "rgba(139,94,42,0.2)", border: "1px solid rgba(139,94,42,0.4)",
                  borderRadius: "4px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPictoMenuSceneId(null)}
            style={{ marginTop: "6px", width: "100%", fontSize: "0.65rem", padding: "4px", background: "rgba(122,26,26,0.3)", border: "1px solid rgba(122,26,26,0.5)", borderRadius: "4px", color: "#f0a0a0", cursor: "pointer" }}>
            Annuler
          </button>
        </div>
      )}

      {/* Overlay sans onClick */}
      <div style={{
        position: "fixed", top: 0, left: "300px", right: 0, bottom: 0,
        zIndex: 44, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(1px)",
      }} aria-hidden="true" />
    </>
  );
}
