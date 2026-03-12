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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", padding: "4px 6px", background: "rgba(255,220,100,0.08)", borderRadius: "4px", border: "1px solid rgba(201,150,42,0.3)" }}>
        <span style={{ fontSize: "0.6rem", color: "#c9a050", fontStyle: "italic", fontFamily: "'Cinzel', serif" }}>
          ✦ Glisser · Tap icône pour changer
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
            <span style={{ fontSize: "0.55rem", color: "#c9a050", fontFamily: "'Cinzel', serif" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* SVG carte */}
      <div ref={containerRef} style={{
        overflowX: "auto", overflowY: "auto", maxHeight: "320px",
        borderRadius: "6px",
        border: "3px solid #6b4c1e",
        boxShadow: "inset 0 0 30px rgba(80,40,0,0.25), 0 4px 16px rgba(0,0,0,0.4)",
        background: "#c8a96e",
      }}>
        <svg width={svgW} height={svgH} style={{ display: "block" }}>
          <defs>
            {/* Texture grain parchemin */}
            <filter id="grain" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise"/>
              <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
              <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blend"/>
              <feComposite in="blend" in2="SourceGraphic" operator="in"/>
            </filter>
            {/* Roughen pour ombres routes */}
            <filter id="roughen" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
            {/* Vignette coins */}
            <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="transparent"/>
              <stop offset="80%" stopColor="transparent"/>
              <stop offset="100%" stopColor="rgba(40,18,0,0.55)"/>
            </radialGradient>
            {/* Brume bords */}
            <radialGradient id="mistL" cx="0%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(232,213,160,0.65)"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            <radialGradient id="mistR" cx="100%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(232,213,160,0.65)"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            <radialGradient id="mistT" cx="50%" cy="0%" r="40%">
              <stop offset="0%" stopColor="rgba(232,213,160,0.6)"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            <radialGradient id="mistB" cx="50%" cy="100%" r="40%">
              <stop offset="0%" stopColor="rgba(232,213,160,0.6)"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
            {/* Grille légère style papier ancien */}
            <pattern id="mapGrid" patternUnits="userSpaceOnUse" width={step} height={step} x={PADDING} y={PADDING}>
              <rect width={step} height={step} fill="transparent"/>
              <line x1={step} y1="0" x2={step} y2={step} stroke="rgba(100,65,20,0.18)" strokeWidth="0.5"/>
              <line x1="0" y1={step} x2={step} y2={step} stroke="rgba(100,65,20,0.18)" strokeWidth="0.5"/>
            </pattern>
          </defs>

          {/* Fond parchemin principal */}
          <rect width={svgW} height={svgH} fill="#e8d09a"/>
          <rect width={svgW} height={svgH} fill="#dfc48a" opacity="0.35"/>
          {/* Grille légère */}
          <rect width={svgW} height={svgH} fill="url(#mapGrid)"/>
          {/* Grain parchemin */}
          <rect width={svgW} height={svgH} fill="#c8a96e" filter="url(#grain)" opacity="0.12"/>

          {/* Micro-texture lignes horizontales papier ancien */}
          {Array.from({ length: Math.ceil(svgH / 30) }).map((_, i) => (
            <line key={`hline-${i}`} x1="0" y1={i * 30} x2={svgW} y2={i * 30}
              stroke="rgba(90,50,0,0.06)" strokeWidth="0.4"/>
          ))}

          {/* Décors cartographiques — montagnes schématiques coins */}
          <g opacity="0.13" fill="none" stroke="#5a3200" strokeWidth="1" style={{pointerEvents:"none"}}>
            <path d={`M8 ${svgH - 40} L22 ${svgH - 62} L36 ${svgH - 40}`}/>
            <path d={`M22 ${svgH - 40} L38 ${svgH - 68} L54 ${svgH - 40}`}/>
            <path d={`M${svgW - 54} 14 L${svgW - 38} 0 L${svgW - 22} 14`}/>
            <path d={`M${svgW - 40} 14 L${svgW - 24} -2 L${svgW - 8} 14`}/>
            <path d={`M8 40 L20 22 L32 40`}/>
          </g>

          {/* Décors cartographiques — forêts schématiques bords */}
          <g opacity="0.13" style={{pointerEvents:"none"}}>
            <circle cx={14} cy={Math.round(svgH / 2 - 10)} r="7" fill="#3a5a20"/>
            <circle cx={26} cy={Math.round(svgH / 2 - 16)} r="9" fill="#3a5a20"/>
            <circle cx={38} cy={Math.round(svgH / 2 - 10)} r="7" fill="#3a5a20"/>
            <circle cx={svgW - 14} cy={Math.round(svgH / 3)} r="7" fill="#3a5a20"/>
            <circle cx={svgW - 26} cy={Math.round(svgH / 3 - 6)} r="9" fill="#3a5a20"/>
            <circle cx={svgW - 38} cy={Math.round(svgH / 3)} r="6" fill="#3a5a20"/>
          </g>

          {/* Boussole en coin bas-droit */}
          <g transform={`translate(${svgW - 42}, ${svgH - 42})`} opacity="0.62" style={{pointerEvents:"none"}}>
            <circle cx="18" cy="18" r="17" fill="rgba(240,220,160,0.7)" stroke="rgba(100,65,20,0.5)" strokeWidth="1.5"/>
            <polygon points="18,4 14,18 18,15 22,18" fill="#8b2020"/>
            <polygon points="18,32 14,18 18,21 22,18" fill="#4a3010"/>
            <polygon points="32,18 18,14 21,18 18,22" fill="#4a3010"/>
            <polygon points="4,18 18,14 15,18 18,22" fill="#4a3010"/>
            <circle cx="18" cy="18" r="3" fill="rgba(100,65,20,0.6)"/>
            <text x="18" y="1.5" textAnchor="middle" fontSize="6" fill="#8b2020" fontFamily="'Cinzel',serif" fontWeight="bold">N</text>
          </g>

          {/* Routes style carte ancienne */}
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const from = cellCenter(fromNode.col, fromNode.row);
            const to = cellCenter(toNode.col, toNode.row);
            const mx = (from.x + to.x) / 2 + (Math.sin(i * 2.5) * 12);
            const my = (from.y + to.y) / 2 + (Math.cos(i * 2.5) * 12);
            const path = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
            return (
              <g key={`edge-${i}`}>
                {/* Route ombre roughen */}
                <path d={path} fill="none" stroke="rgba(60,30,0,0.2)" strokeWidth="7" strokeLinecap="round" filter="url(#roughen)"/>
                {/* Route principale terre */}
                <path d={path} fill="none" stroke="rgba(130,85,35,0.65)" strokeWidth="4" strokeLinecap="round"/>
                {/* Route centre chemin */}
                <path d={path} fill="none" stroke="rgba(210,170,90,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5 4"/>
              </g>
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
{node.isActive && (
  <g style={{ pointerEvents: "none" }}>
    {/* Halo pulsant */}
    <rect x={px - 5} y={py - 5} width={CELL_SIZE + 10} height={CELL_SIZE + 10}
      rx="8" fill="none" stroke="#ffdd44" strokeWidth="3"
      style={{ filter: "drop-shadow(0 0 8px rgba(255,221,68,0.9))", animation: "markerPulse 1.5s ease-in-out infinite" }}
    />
    {/* Mât drapeau */}
    <line x1={px + CELL_SIZE / 2} y1={py - 18} x2={px + CELL_SIZE / 2} y2={py}
      stroke="#fff" strokeWidth="2" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))" }}/>
    {/* Fanion rouge */}
    <polygon
      points={`${px + CELL_SIZE/2},${py - 18} ${px + CELL_SIZE/2 + 11},${py - 13} ${px + CELL_SIZE/2},${py - 8}`}
      fill="#dd2222" stroke="#aa0000" strokeWidth="0.5"
      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
    />
  </g>
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
                    e.stopPropagation();
                    pictoTapRef.current = true;
                    const rect = (e.target as Element).getBoundingClientRect();
                    const menuH = 260;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const yPos = spaceBelow >= menuH
                      ? rect.bottom + 6
                      : Math.max(10, rect.top - menuH - 6);
                    setPictoMenuPos({
                      x: Math.max(10, Math.min(rect.left + rect.width / 2 - 115, window.innerWidth - 240)),
                      y: yPos,
                    });
                    setPictoMenuSceneId((prev) => prev === node.id ? null : node.id);
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

                {/* Bandeau état bas de case */}
                <rect
                  x={px} y={py + CELL_SIZE - 11}
                  width={CELL_SIZE} height={11} rx="0"
                  fill={node.isActive ? "#c9962a" : node.isVisited ? "#7aaa50" : "rgba(80,55,25,0.55)"}
                  opacity="0.92"
                />
                <text
                  x={center.x} y={py + CELL_SIZE - 4}
                  textAnchor="middle" fontSize="5.5"
                  fill="#fff" fontFamily="'Cinzel', serif" fontWeight="700"
                  style={{ pointerEvents: "none", userSelect: "none", letterSpacing: "0.04em" }}
                >
                  {node.isActive ? "ACTIVE" : node.isVisited ? "VISITÉE" : ""}
                </text>

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
          {/* Brume bords */}
          <rect width={svgW} height={svgH} fill="url(#mistL)" style={{pointerEvents:"none"}}/>
          <rect width={svgW} height={svgH} fill="url(#mistR)" style={{pointerEvents:"none"}}/>
          <rect width={svgW} height={svgH} fill="url(#mistT)" style={{pointerEvents:"none"}}/>
          <rect width={svgW} height={svgH} fill="url(#mistB)" style={{pointerEvents:"none"}}/>
          {/* Vignette coins */}
          <rect width={svgW} height={svgH} fill="url(#vignette)" style={{pointerEvents:"none"}}/>
        </svg>
      </div>

      {/* Menu pictogramme */}
      {pictoMenuSceneId && (
        <div style={{
          position: "fixed",
          top: pictoMenuPos.y,
          left: pictoMenuPos.x,
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
        @keyframes markerPulse {
          0%, 100% { opacity: 1; stroke-width: 3; }
          50% { opacity: 0.4; stroke-width: 5; }
        }
      `}</style>
    </div>
  );
}
