import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChoiceIcon } from "../components/ChoiceIcon";
import { ImprovisationModal } from "../components/ImprovisationModal";
import { ItemDetail } from "../components/ItemDetail";
import { ItemEditor } from "../components/ItemEditor";
import { addItem, deleteItem, getItems, updateItem } from "../lib/itemsStorage";
import { useAppData } from "../state/AppDataContext";
import { useSettings } from "../state/SettingsContext";
import type { Item } from "../types/item";

const attitudeStyles: Record<string, string> = {
  friendly: "badge badge-friendly",
  neutral: "badge badge-neutral",
  wary: "badge badge-wary",
  hostile: "badge badge-hostile",
};

type SearchScope = "all" | "scenes" | "npcs" | "places" | "items";
type SearchResult =
  | {
      id: string;
      type: "scene";
      title: string;
      snippet?: string;
    }
  | {
      id: string;
      type: "npc";
      title: string;
      subtitle?: string;
      snippet?: string;
    }
  | {
      id: string;
      type: "place";
      title: string;
      subtitle?: string;
      snippet?: string;
    }
  | {
      id: string;
      type: "item";
      title: string;
      subtitle?: string;
      snippet?: string;
    };

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function makeSnippet(
  value: string,
  query: string,
  maxLength: number = 120,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);
  if (!normalizedValue.includes(normalizedQuery)) {
    return undefined;
  }
  const index = normalizedValue.indexOf(normalizedQuery);
  const start = Math.max(0, index - 30);
  const end = Math.min(value.length, index + query.length + 60);
  const slice = value.slice(start, end).trim();
  if (slice.length <= maxLength) {
    return slice;
  }
  return `${slice.slice(0, maxLength)}…`;
}

export function SessionLivePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const {
    data,
    addSceneLiveNote,
    removeSceneLiveNote,
    createPlayerCharacter,
    updatePlayerCharacter,
    deletePlayerCharacter,
    findCampaignBySessionId,
  } = useAppData();
  const { settings } = useSettings();
  const containerRef = useRef<HTMLElement | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const scenePanelRef = useRef<HTMLDivElement | null>(null);
  const session = data.sessions.find((entry) => entry.id === sessionId);
  const campaign = sessionId ? findCampaignBySessionId(sessionId) : null;
  const places = campaign?.places ?? [];

  const scenes = useMemo(() => session?.scenes ?? [], [session]);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    scenes[0]?.id ?? null,
  );
  const [noteText, setNoteText] = useState("");
  const [clockLabel, setClockLabel] = useState(() =>
    new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const [rightPanelTab, setRightPanelTab] = useState<
    "scenes" | "npcs" | "places" | "items" | "pcs" | null
  >(null);
  const RIGHT_PANEL_COLLAPSED_PX = 75;
  const RIGHT_PANEL_EXPANDED_PX = 160;
  const RIGHT_PANEL_PCS_PX = 360;
  const isRightPanelExpanded = rightPanelTab !== null;
  const rightPanelWidth =
    rightPanelTab === "pcs"
      ? RIGHT_PANEL_PCS_PX
      : isRightPanelExpanded
        ? RIGHT_PANEL_EXPANDED_PX
        : RIGHT_PANEL_COLLAPSED_PX;
  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);
  const [isCombatMode, setIsCombatMode] = useState(false);
  const [isDimMode] = useState(() => {
    try {
      return localStorage.getItem("tor-live-dim-enabled") === "true";
    } catch {
      return false;
    }
  });
  const [noteTargetSceneId, setNoteTargetSceneId] = useState<string | null>(
    null,
  );
  const lastSceneIdRef = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [quickNpcId, setQuickNpcId] = useState<string | null>(null);
  const [quickPlaceId, setQuickPlaceId] = useState<string | null>(null);
  const [quickItemId, setQuickItemId] = useState<string | null>(null);
  const [showImprovisation, setShowImprovisation] = useState(false);
  const [panelMode, setPanelMode] = useState<
    "npc" | "place" | "item" | "item-edit" | "search" | null
  >(null);
  const [flashSceneId, setFlashSceneId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Item[]>(() => getItems());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "mj-items") {
        setItems(getItems());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!selectedSceneId && scenes[0]) {
      setSelectedSceneId(scenes[0].id);
      return;
    }
    if (selectedSceneId && !scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(scenes[0]?.id ?? null);
    }
  }, [scenes, selectedSceneId]);

  useEffect(() => {
    const updateClock = () =>
      setClockLabel(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    console.info("[SessionLive] mounted", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    if (panelMode === "search") {
      const timer = window.setTimeout(
        () => setDebouncedQuery(searchQuery),
        150,
      );
      return () => window.clearTimeout(timer);
    }
    if (panelMode === null) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSearchScope("all");
    }
    return undefined;
  }, [panelMode, searchQuery]);

  useEffect(() => {
    if (panelMode !== "search") {
      return;
    }
    searchInputRef.current?.focus();
  }, [panelMode]);

  useEffect(() => {
    if (!panelMode) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelMode(null);
        setQuickNpcId(null);
        setQuickPlaceId(null);
        setQuickItemId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelMode]);

  if (!session || !sessionId) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Session introuvable</h2>
        <Link to="/sessions" className="text-oak underline">
          Retour aux sessions
        </Link>
      </section>
    );
  }

  const selectedScene =
    scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const linkedNpcs = selectedScene
    ? data.npcs.filter((npc) => selectedScene.linkedNpcIds.includes(npc.id))
    : [];
  const linkedNpcIds = useMemo(() => {
    const ids = new Set<string>();
    if (session) {
      for (const scene of session.scenes) {
        for (const npcId of scene.linkedNpcIds) {
          ids.add(npcId);
        }
      }
    }
    return ids;
  }, [session]);
  const sessionNpcs = useMemo(() => {
    if (linkedNpcIds.size === 0) {
      return { list: data.npcs, hasFallback: true };
    }
    return {
      list: data.npcs.filter((npc) => linkedNpcIds.has(npc.id)),
      hasFallback: false,
    };
  }, [data.npcs, linkedNpcIds]);
  const pcs = data.pcs ?? [];
  const selectedPc = selectedPcId
    ? (pcs.find((pc) => pc.id === selectedPcId) ?? null)
    : null;
  const [usedChoiceIds, setUsedChoiceIds] = useState<Record<string, string[]>>(
    {},
  );

  useEffect(() => {
    if (!selectedScene) {
      setNoteTargetSceneId(null);
      lastSceneIdRef.current = null;
      return;
    }
    if (lastSceneIdRef.current !== selectedScene.id) {
      setNoteTargetSceneId(selectedScene.id);
      lastSceneIdRef.current = selectedScene.id;
    }
  }, [selectedScene]);

  useEffect(() => {
    if (!selectedPcId) {
      return;
    }
    if (!pcs.some((pc) => pc.id === selectedPcId)) {
      setSelectedPcId(null);
    }
  }, [pcs, selectedPcId]);

  useEffect(() => {
  }, [selectedPcId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Keyboard shortcuts are scoped to the page and avoid direct modal control here.
      if (event.key.toLowerCase() === "n") {
        noteInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleAddNote() {
    if (!selectedScene) {
      return;
    }
    if (!sessionId) {
      return;
    }
    const targetId = noteTargetSceneId ?? selectedScene.id;
    if (!targetId) {
      return;
    }
    addSceneLiveNote(sessionId, targetId, noteText, selectedScene.id);
    setNoteText("");
  }

  const selectedSceneTitle = selectedScene?.title?.trim()
    ? selectedScene.title
    : selectedScene
      ? "Scène sans titre"
      : "Scène";
  const selectedPlace = selectedScene?.placeId
    ? (places.find((place) => place.id === selectedScene.placeId) ?? null)
    : null;

  const searchResults = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed || !session) {
      return {
        scenes: [] as SearchResult[],
        npcs: [] as SearchResult[],
        places: [] as SearchResult[],
        items: [] as SearchResult[],
      };
    }
    const normalizedQuery = normalizeText(trimmed);

    const sceneResults: SearchResult[] = session.scenes
      .filter((scene) => {
        const haystack = [scene.title, scene.text].filter(Boolean).join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((scene) => ({
        id: scene.id,
        type: "scene",
        title: scene.title?.trim() || "Scène sans titre",
        snippet: makeSnippet(scene.text, trimmed),
      }));

    const npcResults: SearchResult[] = sessionNpcs.list
      .filter((npc) => {
        const haystack = [
          npc.name,
          npc.role,
          npc.description,
          npc.notes,
          npc.locationText,
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((npc) => ({
        id: npc.id,
        type: "npc",
        title: npc.name || "PNJ sans nom",
        subtitle:
          npc.role || (sessionNpcs.hasFallback ? "Hors session" : "Aucun rôle"),
        snippet:
          makeSnippet(npc.description, trimmed) ??
          makeSnippet(npc.notes, trimmed) ??
          makeSnippet(npc.locationText, trimmed),
      }));

    const placeResults: SearchResult[] = places
      .filter((place) => {
        const haystack = [place.name, place.region, place.description]
          .filter(Boolean)
          .join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((place) => ({
        id: place.id,
        type: "place",
        title: place.name || "Lieu sans nom",
        subtitle: place.region || "Lieu de campagne",
        snippet: makeSnippet(place.description ?? "", trimmed),
      }));

    const itemResults: SearchResult[] = items
      .filter((item) => {
        const haystack = [item.name, item.description, item.notes]
          .filter(Boolean)
          .join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((item) => ({
        id: item.id,
        type: "item",
        title: item.name?.trim() || "Objet sans nom",
        subtitle: `${(item.linkedNpcIds?.length ?? 0)} PNJ • ${(item.linkedPlaceIds?.length ?? 0)} Lieux`,
        snippet:
          makeSnippet(item.description ?? "", trimmed) ??
          makeSnippet(item.notes ?? "", trimmed),
      }));

    return {
      scenes: sceneResults,
      npcs: npcResults,
      places: placeResults,
      items: itemResults,
    };
  }, [debouncedQuery, session, sessionNpcs, places, items]);

  const quickNpc = quickNpcId
    ? data.npcs.find((npc) => npc.id === quickNpcId)
    : null;
  const quickPlace = quickPlaceId
    ? places.find((place) => place.id === quickPlaceId)
    : null;
  const quickItem = quickItemId
    ? items.find((item) => item.id === quickItemId) ?? null
    : null;
  const isQuickOpen = panelMode !== null;
  const quickPlaceScenes = useMemo(() => {
    if (!quickPlace) {
      return { currentSession: [], otherCount: 0 };
    }
    const all = data.sessions.flatMap((entry) =>
      entry.scenes
        .filter((scene) => scene.placeId === quickPlace.id)
        .map((scene) => ({ session: entry, scene })),
    );
    const currentSession = session
      ? all.filter((entry) => entry.session.id === session.id)
      : [];
    const otherCount = all.length - currentSession.length;
    return { currentSession, otherCount };
  }, [quickPlace, data.sessions, session]);

  function handleSelectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
    setFlashSceneId(sceneId);
    setPanelMode(null);
    setQuickItemId(null);
    window.setTimeout(() => setFlashSceneId(null), 800);
  }

  function handleCreateItem() {
    const itemId = addItem({
      name: "Nouvel objet",
      description: "",
      linkedNpcIds: [],
      linkedPlaceIds: [],
      notes: "",
    });
    setItems(getItems());
    setQuickNpcId(null);
    setQuickPlaceId(null);
    setQuickItemId(itemId);
    setPanelMode("item-edit");
  }

  function handleDeleteItem(itemId: string) {
    deleteItem(itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setQuickItemId(null);
    setPanelMode(null);
  }

  return (
    <section
      ref={containerRef}
      className={`session-live h-screen w-full overflow-x-hidden bg-transparent ${isDimMode ? "is-dim" : ""}`}
    >
      {showImprovisation && (
        <ImprovisationModal onClose={() => setShowImprovisation(false)} />
      )}
      <div className="space-y-6 py-5">
        <header
          className="relative flex flex-wrap items-center justify-between gap-3 px-6"
          style={{
            background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
            border: "2px solid #8b5e2a",
            borderRadius: "2px 12px 2px 12px",
            padding: "1rem 1.5rem",
            boxShadow: "4px 4px 20px rgba(0,0,0,0.3)",
            marginRight: `${rightPanelWidth + 5}px`,
          }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] font-cinzel"
              style={{ color: "#8a6010" }}
            >
              Session Live
            </p>
            <h2 className="page-title text-2xl">
              {session.title || "Session sans titre"}
            </h2>
            <p className="text-sm text-stone-700">
              {session.objective || "Aucun objectif défini."}
            </p>
            {session.openingText && (
              <p className="mt-2 max-w-2xl text-sm italic text-stone-700">
                {session.openingText}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-neutral px-3 py-2 text-sm">
              {clockLabel}
            </span>
            <button
              type="button"
              onClick={() => setPanelMode("search")}
              className="btn btn-subtle"
              aria-label="Recherche"
            >
              🔍
            </button>
            <Link
              to={`/sessions/${sessionId}`}
              className="btn-outline-medieval text-sm"
            >
              Retour aux détails
            </Link>
          </div>
        </header>

        <div
          className="live-layout mx-auto w-full max-w-[1200px] min-w-0 px-6"
          style={{
            paddingRight: `${rightPanelWidth + 10}px`,
          }}
        >
          <div
            ref={scenePanelRef}
            className="scene-panel card card-muted flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out"
          >
            <div
              className="grimoire-container flex min-h-0 flex-col"
                style={{
                      background: 'linear-gradient(160deg, #fdf6e3, #f0dfa8)',
                      border: '2px solid #8b5e2a',
                      borderRadius: '2px 12px 2px 12px',
                      boxShadow: '4px 4px 20px rgba(0,0,0,0.35)',
                      padding: '1.5rem',
                }}
            >
              <div
                key={selectedScene?.id ?? "empty"}
                className="grimoire-page flex min-h-0 flex-col"
              >
                <div className="flex flex-wrap items-center justify-between gap-2"
                  style={{
                      background: 'linear-gradient(160deg, #fdf6e3, #f5e6c0)',
                      border: '2px solid #8b5e2a',
                      borderRadius: '2px 12px 2px 12px',
                      padding: '0.75rem 1.25rem',
                      marginBottom: '1rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-700 font-cinzel">
                    Scène sélectionnée
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-lg font-semibold font-cinzel text-amber-950 tracking-wide">
                      {selectedSceneTitle}
                    </h4>
                  </div>
                  {selectedPlace && (
                    <button
                      type="button"
                      onClick={() => {
                        console.info(
                          "[Live] open place quick view",
                          selectedPlace.id,
                        );
                        setQuickNpcId(null);
                        setQuickItemId(null);
                        setQuickPlaceId(selectedPlace.id);
                        setPanelMode("place");
                      }}
                      className="text-sm live-muted cursor-pointer text-left hover:underline"
                      aria-label={`Ouvrir le lieu ${selectedPlace.name}`}
                    >
                      📍 {selectedPlace.name}
                      {selectedPlace.region ? ` — ${selectedPlace.region}` : ""}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex min-h-0 flex-col space-y-6 overflow-y-auto pr-1">
                <section className="section-card p-5">
                  <p className="field-label mb-1">
                    Texte de scène
                  </p>
                  <h5 className="text-2xl font-semibold tracking-wide text-amber-950 mb-6 font-cinzel border-b border-amber-800/30 pb-3">
                    {selectedSceneTitle}
                  </h5>
                  <div className="parchment-text text-base leading-relaxed text-stone-800 whitespace-pre-line">
                    {selectedScene?.text || "Aucun texte pour le moment."}
                  </div>
                </section>

                <section className="section-card p-4 relative">
                  <p className="field-label mb-1">
                    Choix
                  </p>
                  {(() => {
                    const choices = selectedScene?.choices ?? [];
                    const count = choices.length;
                    const gridClass =
                      count <= 2
                        ? "mt-4 grid gap-4 place-items-center sm:grid-cols-2"
                        : count <= 4
                          ? "mt-3 grid gap-3 sm:grid-cols-2"
                          : count <= 6
                            ? "mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                            : "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3";
                    const cardClass =
                      count <= 2
                        ? "min-h-[140px] px-6 py-6"
                        : count <= 4
                          ? "min-h-[120px] px-5 py-5"
                          : count <= 6
                            ? "min-h-[104px] px-4 py-4"
                            : "min-h-[92px] px-3 py-3";
                    return (
                      <div className={gridClass}>
                        {choices.map((choice) => {
                          const hasLinkedScene =
                            choice.targetType === "place" &&
                            scenes.some(
                              (scene) =>
                                scene.id !== selectedScene?.id &&
                                scene.placeId === choice.targetId,
                            );
                          const usedIds =
                            usedChoiceIds[selectedScene?.id ?? ""] ?? [];
                          const isUsed = usedIds.includes(choice.id);
                          const isTaken = choice.isTaken ?? isUsed;
                          const isLocked = choice.isLocked ?? false;
                          const isImportant = choice.isImportant ?? false;
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              disabled={isLocked}
                              className={`group relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-[#8b5e2a]/40 bg-[#f5e6c0]/60 px-6 py-6 text-stone-800 shadow-[0_6px_14px_rgba(67,41,21,0.25)] hover:bg-[#e8cc8a]/70 transition-all duration-150 ease-out will-change-transform active:scale-[0.98] active:bg-stone-300/40 ${cardClass} ${
                                isImportant ? "border-stone-500 bg-stone-100/60" : ""
                              } ${isTaken ? "opacity-60 bg-stone-200/40" : ""} ${
                                isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                              }`}
                              onClick={() => {
                                if (choice.targetType === "place") {
                                  setQuickNpcId(null);
                                  setQuickItemId(null);
                                  setQuickPlaceId(choice.targetId);
                                  setPanelMode("place");
                                } else if (choice.targetType === "npc") {
                                  setQuickPlaceId(null);
                                  setQuickItemId(null);
                                  setQuickNpcId(choice.targetId);
                                  setPanelMode("npc");
                                }
                                if (selectedScene) {
                                  setUsedChoiceIds((prev) => {
                                    const sceneKey = selectedScene.id;
                                    const next = new Set(prev[sceneKey] ?? []);
                                    next.add(choice.id);
                                    return {
                                      ...prev,
                                      [sceneKey]: Array.from(next),
                                    };
                                  });
                                }
                              }}
                            >
                              <span className="absolute inset-0 rounded-xl opacity-[0.25] mix-blend-multiply [background-image:repeating-linear-gradient(45deg,rgba(120,74,32,0.06)_0px,rgba(120,74,32,0.06)_1px,transparent_1px,transparent_6px)]" />
                              {isLocked && (
                                <span className="absolute left-3 top-3" aria-hidden="true">
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    className="text-stone-600 opacity-90"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                    <rect x="6" y="11" width="12" height="10" rx="2" />
                                  </svg>
                                </span>
                              )}
                              <span className="relative flex w-full flex-col items-center justify-center gap-3">
                                <ChoiceIcon
                                  intent={choice.intent}
                                  size={22}
                                  strokeWidth={1.5}
                                  className={isLocked ? "text-stone-600" : "text-stone-700"}
                                />
                                <span className="text-sm font-medium text-stone-800 text-center">
                                  {choice.label}
                                </span>
                                {hasLinkedScene && (
                                  <span
                                    className="absolute right-3 top-3 text-xs text-stone-600"
                                    aria-hidden="true"
                                  >
                                    ➜
                                  </span>
                                )}
                              </span>
                              {isTaken && (
                                <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-stone-500">
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {(selectedScene?.choices?.length ?? 0) === 0 && (
                          <p className="rounded-md border border-stone-300 bg-white/50 px-3 py-2 text-sm live-muted">
                            Aucun choix défini.
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {settings.improvisationEnabled && (
                    <button
                      className="mt-6 w-full btn-gold-medieval py-3 text-base"
                      onClick={() => setShowImprovisation(true)}
                      type="button"
                    >
                      🎲 Situation imprévue
                    </button>
                  )}
                </section>

                <div className="grid gap-6 lg:grid-cols-2" style={{ overflow: 'visible' }}>
                  <section
                    className="section-card p-4 relative"
                    style={{
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    <p className="field-label mb-1">Personnages</p>
                    <div className="mt-2 space-y-2">
                      {linkedNpcs.map((npc) => (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickPlaceId(null);
                            setQuickItemId(null);
                            setQuickNpcId(npc.id);
                            setPanelMode("npc");
                          }}
                          key={npc.id}
                          className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-stone-300 bg-white/60 px-3 py-2 text-left text-sm hover:bg-stone-100/70"
                        >
                          <div>
                            <p className="font-medium">
                              {npc.name || "PNJ sans nom"}
                            </p>
                            <p className="text-xs live-muted">
                              {npc.role || "Aucun rôle"}
                            </p>
                          </div>
                          <span
                            className={
                              attitudeStyles[npc.attitude] ??
                              attitudeStyles.neutral
                            }
                          >
                            {npc.attitude}
                          </span>
                        </button>
                      ))}
                      {linkedNpcs.length === 0 && (
                        <p className="rounded-md border border-stone-300 bg-white/50 px-3 py-2 text-sm live-muted">
                          Aucun personnage lié à cette scène.
                        </p>
                      )}
                    </div>
                  </section>

                  <section
                    className="section-card p-4 relative"
                    style={{
                      boxShadow:
                        "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="field-label mb-1">Notes</p>
                    </div>
                    <div className="mt-2 flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1">
                      {selectedScene?.liveNotes?.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-stone-300 bg-white/60 px-3 py-2"
                        >
                          {(() => {
                            const sourceScene = scenes.find(
                              (scene) => scene.id === note.createdFromSceneId,
                            );
                            const sourceLabel = sourceScene
                              ? sourceScene.title?.trim() || "Scène sans titre"
                              : note.createdFromSceneId
                                ? "(scène supprimée)"
                                : selectedSceneTitle;
                            const labelText =
                              sourceLabel === selectedSceneTitle
                                ? `Depuis: ${selectedSceneTitle}`
                                : `Depuis: ${sourceLabel}`;
                            return (
                              <p className="text-sm text-stone-600 italic break-words whitespace-normal">
                                {new Date(note.createdAt).toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}{" "}
                                —{" "}
                                <span className="not-italic font-medium">{labelText}</span>{" "}
                                — {note.text}
                              </p>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => {
                              if (!sessionId || !selectedScene) {
                                return;
                              }
                              const confirmed = window.confirm(
                                "Supprimer cette note ?",
                              );
                              if (!confirmed) {
                                return;
                              }
                              removeSceneLiveNote(
                                sessionId,
                                selectedScene.id,
                                note.id,
                              );
                            }}
                            className="btn btn-subtle text-xs"
                            aria-label="Supprimer la note"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                      {(selectedScene?.liveNotes?.length ?? 0) === 0 && (
                        <p className="rounded-md border border-stone-300 bg-white/50 px-3 py-2 text-sm text-stone-600 italic">
                          Aucune note pour le moment.
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex flex-shrink-0 flex-col gap-2 lg:flex-row">
                      <label className="flex min-h-11 items-center gap-2 text-xs live-muted">
                        Ajouter à :
                        <select
                          value={noteTargetSceneId ?? ""}
                          onChange={(event) =>
                            setNoteTargetSceneId(event.target.value || null)
                          }
                          className="live-input min-h-11 w-44 flex-shrink-0 rounded-md px-3 py-2 text-sm"
                        >
                          {scenes.map((scene) => {
                            const title =
                              scene.title?.trim() || "Scène sans titre";
                            return (
                              <option key={scene.id} value={scene.id}>
                                {title}
                              </option>
                            );
                          })}
                          {scenes.length === 0 && (
                            <option value="">Aucune scène</option>
                          )}
                        </select>
                      </label>
                      <input
                        ref={noteInputRef}
                        value={noteText}
                        onChange={(event) => setNoteText(event.target.value)}
                        placeholder="Ajouter une note rapide..."
                        className="live-input min-h-11 flex-1 min-w-0 rounded-md px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddNote}
                        className="btn-gold-medieval flex-shrink-0 px-4 py-2 text-sm"
                      >
                        Ajouter
                      </button>
                    </div>
                  </section>
                </div>
              </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div
          className="panel-wood fixed right-0 top-0 z-40 h-screen flex flex-col p-2 gap-1"
          style={{
            width: rightPanelWidth,
            transition: "width 240ms ease",
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="menu-section">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab((prev) =>
                    prev === "scenes" ? null : "scenes",
                  )
                }
                aria-expanded={rightPanelTab === "scenes"}
                aria-controls="right-panel-scenes"
                className={`menu-toggle relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
                  rightPanelTab === "scenes"
                    ? "border-amber-400 bg-[#7a4500] text-amber-50"
                    : "border-amber-600/60 bg-[#3d1f00] hover:bg-[#5a2e00] text-amber-100"
                }`}
              >
                {rightPanelTab === "scenes" && (
                  <span aria-hidden="true" className="absolute top-1 right-1">
                    <span
                      className="absolute inset-0 rounded-full bg-stone-1000/30 animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-stone-600 ring-2 ring-stone-300/70 shadow-[0_0_6px_rgba(180,83,9,0.35)]" />
                  </span>
                )}
                <span className="flex w-full flex-col items-center justify-center gap-1">
                  <span aria-hidden="true" className="text-base">
                    🎬
                  </span>
                  {!isRightPanelExpanded && (
                    <span className="text-[10px] font-semibold tracking-wide text-amber-200">
                      Sc
                    </span>
                  )}
                  {isRightPanelExpanded && (
                    <span className="w-full truncate text-left text-xs font-medium text-amber-100">
                      Scènes
                    </span>
                  )}
                </span>
              </button>
              <div
                id="right-panel-scenes"
                role="region"
                aria-hidden={rightPanelTab !== "scenes"}
                className={`section-content relative mt-2 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                  rightPanelTab === "scenes"
                    ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
                    : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
                }`}
                style={{
                  maxHeight:
                    rightPanelTab === "scenes"
                      ? "calc(100vh - 72px - 140px)"
                      : 0,
                  boxShadow:
                    rightPanelTab === "scenes"
                      ? "0 8px 24px rgba(30,20,10,0.12)"
                      : "none",
                }}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-stone-500/10" />
                <div className="space-y-2 overflow-y-auto py-2">
                  {scenes.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`w-full rounded-md border px-2 py-2 text-left text-sm transition-all ${
                        scene.id === selectedSceneId
                          ? "border-[#8b5e2a] bg-[#f5e6c0] font-semibold shadow-[inset_2px_0_0_#c9962a]"
                          : "border-stone-300 bg-white/90 hover:bg-[#fdf6e3] hover:border-[#c9962a]/50"
                      } ${flashSceneId === scene.id ? "flash-ring" : ""}`}
                    >
                      <div className="font-medium">
                        {scene.title || "Scène sans titre"}
                      </div>
                      {(scene.liveNotes?.length ?? 0) > 0 && (
                        <div className="mt-1 text-xs text-stone-600">
                          📝 Notes : {scene.liveNotes?.length ?? 0}
                        </div>
                      )}
                      {(scene.linkedNpcIds?.length ?? 0) > 0 && (
                        <div className="text-xs text-stone-600">
                          🎭 PNJ : {scene.linkedNpcIds.length}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="menu-section">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab((prev) => (prev === "pcs" ? null : "pcs"))
                }
                aria-expanded={rightPanelTab === "pcs"}
                aria-controls="right-panel-pcs"
                className={`menu-toggle relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
                  rightPanelTab === "pcs"
                    ? "border-amber-400 bg-[#7a4500] text-amber-50"
                    : "border-amber-600/60 bg-[#3d1f00] hover:bg-[#5a2e00] text-amber-100"
                }`}
              >
                {rightPanelTab === "pcs" && (
                  <span aria-hidden="true" className="absolute top-1 right-1">
                    <span
                      className="absolute inset-0 rounded-full bg-stone-1000/30 animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-stone-600 ring-2 ring-stone-300/70 shadow-[0_0_6px_rgba(180,83,9,0.35)]" />
                  </span>
                )}
                <span className="flex w-full flex-col items-center justify-center gap-1">
                  <span aria-hidden="true" className="text-base">
                    🧝
                  </span>
                  {!isRightPanelExpanded && (
                    <span className="text-[10px] font-semibold tracking-wide text-amber-200">
                      PJ
                    </span>
                  )}
                  {isRightPanelExpanded && (
                    <span className="w-full truncate text-left text-xs font-medium text-amber-100">
                      PJ
                    </span>
                  )}
                </span>
              </button>
              <div
                id="right-panel-pcs"
                role="region"
                aria-hidden={rightPanelTab !== "pcs"}
                className={`section-content relative mt-2 origin-top overflow-hidden transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                  rightPanelTab === "pcs"
                    ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
                    : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
                }`}
                style={{
                  maxHeight:
                    rightPanelTab === "pcs" ? "calc(100vh - 72px - 140px)" : 0,
                  boxShadow:
                    rightPanelTab === "pcs"
                      ? "0 8px 24px rgba(30,20,10,0.12)"
                      : "none",
                }}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-stone-500/10" />
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 font-cinzel">
                      Registre des PJ
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newId = createPlayerCharacter();
                          setSelectedPcId(newId);
                        }}
                        className="btn btn-subtle px-2 text-xs"
                      >
                        + PJ
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCombatMode((prev) => !prev)}
                        className={`btn btn-subtle px-2 text-xs ${isCombatMode ? "btn-active" : ""}`}
                      >
                        ⚔️
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-y-auto pr-1">
                    <div className="relative rounded-xl border border-stone-300 bg-stone-200 p-3 shadow-[0_8px_18px_rgba(62,38,19,0.12)]">
                      <div className="pointer-events-none absolute inset-y-3 left-1/2 hidden w-px -translate-x-1/2 bg-stone-400/20 lg:block" />
                      <div
                        className={`grid gap-3 ${
                          isCombatMode
                            ? "sm:grid-cols-2 lg:grid-cols-2"
                            : "sm:grid-cols-2 lg:grid-cols-3"
                        }`}
                      >
                        {pcs.map((pc) => {
                          const hpMax = Math.max(0, pc.hpMax);
                          const hpCurrent = Math.max(
                            0,
                            Math.min(pc.hpCurrent, hpMax || pc.hpCurrent),
                          );
                          const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 0;
                          const isLow = hpMax > 0 && hpRatio < 0.3;
                          return (
                            <button
                              key={pc.id}
                              type="button"
                              onClick={() => setSelectedPcId(pc.id)}
                              className={`text-left rounded-lg border border-stone-300 bg-white/70 px-3 py-3 shadow-[0_4px_10px_rgba(62,38,19,0.12)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_14px_rgba(62,38,19,0.18)] ${
                                selectedPcId === pc.id
                                  ? "ring-1 ring-stone-500/40"
                                  : ""
                              } ${isCombatMode ? "px-2 py-2" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-stone-900">
                                    {pc.name}
                                  </p>
                                  <p className="text-xs text-stone-600">
                                    {pc.role || "Sans rôle"}
                                  </p>
                                </div>
                                <span className="text-[10px] text-stone-600">
                                  🧝
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-stone-700">
                                  <span className={isLow ? "text-stone-700" : ""}>
                                    PV
                                  </span>
                                  <span className={isLow ? "text-stone-700" : ""}>
                                    {hpCurrent} / {hpMax || "—"}
                                  </span>
                                </div>
                                <div
                                  className={`mt-1 w-full rounded-full bg-stone-500/10 ${
                                    isCombatMode ? "h-2.5" : "h-1.5"
                                  }`}
                                >
                                  <div
                                    className={`h-full rounded-full ${
                                      isLow ? "bg-stone-500/40" : "bg-stone-600/35"
                                    }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, hpRatio * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div
                                className={`mt-2 flex flex-wrap gap-1 text-[10px] ${
                                  isCombatMode
                                    ? "text-stone-700"
                                    : "text-stone-600 min-h-[18px]"
                                }`}
                              >
                                {pc.conditions.map((condition) => (
                                  <span
                                    key={condition}
                                    className="rounded-full border border-stone-300 bg-stone-100/70 px-2 py-0.5"
                                  >
                                    {condition}
                                  </span>
                                ))}
                                {pc.conditions.length === 0 && !isCombatMode && (
                                  <span className="text-stone-400">
                                    Aucun état
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-stone-700">
                                {[
                                  { key: "for", label: "FOR" },
                                  { key: "dex", label: "DEX" },
                                  { key: "int", label: "INT" },
                                  { key: "con", label: "CON" },
                                ].map((stat) => (
                                  <div
                                    key={stat.key}
                                    className="flex flex-col items-center"
                                  >
                                    <span className="font-semibold">
                                      {stat.label}
                                    </span>
                                    <span>
                                      {pc.stats[stat.key as keyof typeof pc.stats]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                        {pcs.length === 0 && (
                          <p className="col-span-full rounded-md border border-stone-300 bg-white/70 px-3 py-2 text-sm text-stone-600">
                            Aucun PJ enregistré.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedPc && (
                    <div className="rounded-xl border border-stone-300 bg-stone-200 p-3 shadow-[0_6px_14px_rgba(62,38,19,0.14)] transition-all duration-200">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-stone-600">
                            Fiche PJ
                          </p>
                          <p className="text-sm font-semibold text-stone-900">
                            {selectedPc.name}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPcId(null)}
                          className="btn btn-subtle px-2 text-xs"
                        >
                          Fermer
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        <input
                          value={selectedPc.name}
                          onChange={(event) =>
                            updatePlayerCharacter(selectedPc.id, {
                              name: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white/70 px-3 py-2 text-sm"
                          placeholder="Nom du PJ"
                        />
                        <input
                          value={selectedPc.role}
                          onChange={(event) =>
                            updatePlayerCharacter(selectedPc.id, {
                              role: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white/70 px-3 py-2 text-sm"
                          placeholder="Classe / rôle"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updatePlayerCharacter(selectedPc.id, {
                                hpCurrent: Math.max(0, selectedPc.hpCurrent - 1),
                              })
                            }
                            className="btn btn-subtle px-2 text-xs"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={selectedPc.hpCurrent}
                            onChange={(event) =>
                              updatePlayerCharacter(selectedPc.id, {
                                hpCurrent: Number(event.target.value),
                              })
                            }
                            className="w-20 rounded-md border border-stone-300 bg-white/70 px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-stone-600">/</span>
                          <input
                            type="number"
                            value={selectedPc.hpMax}
                            onChange={(event) =>
                              updatePlayerCharacter(selectedPc.id, {
                                hpMax: Number(event.target.value),
                              })
                            }
                            className="w-20 rounded-md border border-stone-300 bg-white/70 px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updatePlayerCharacter(selectedPc.id, {
                                hpCurrent: Math.min(
                                  selectedPc.hpMax,
                                  selectedPc.hpCurrent + 1,
                                ),
                              })
                            }
                            className="btn btn-subtle px-2 text-xs"
                          >
                            +
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(
                            [
                              { key: "for", label: "FOR" },
                              { key: "dex", label: "DEX" },
                              { key: "int", label: "INT" },
                              { key: "con", label: "CON" },
                            ] as const
                          ).map((stat) => (
                            <label
                              key={stat.key}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-stone-600">
                                {stat.label}
                              </span>
                              <input
                                value={selectedPc.stats[stat.key]}
                                onChange={(event) =>
                                  updatePlayerCharacter(selectedPc.id, {
                                    stats: {
                                      ...selectedPc.stats,
                                      [stat.key]: Number(event.target.value),
                                    },
                                  })
                                }
                                className="w-16 rounded-md border border-stone-300 bg-white/70 px-2 py-1 text-sm"
                                type="number"
                              />
                            </label>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 font-cinzel">
                            États
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[
                              "☠️",
                              "🩸",
                              "😵",
                              "💤",
                            ].map((condition) => {
                              const active = selectedPc.conditions.includes(condition);
                              return (
                                <button
                                  key={condition}
                                  type="button"
                                  onClick={() =>
                                    updatePlayerCharacter(selectedPc.id, {
                                      conditions: active
                                        ? selectedPc.conditions.filter(
                                            (item) => item !== condition,
                                          )
                                        : [...selectedPc.conditions, condition],
                                    })
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs ${
                                    active
                                      ? "border-stone-500/70 bg-stone-200"
                                      : "border-stone-300 bg-white/70"
                                  }`}
                                >
                                  {condition}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm("Supprimer ce PJ ?");
                            if (!confirmed) {
                              return;
                            }
                            deletePlayerCharacter(selectedPc.id);
                            setSelectedPcId(null);
                          }}
                          className="btn btn-danger text-xs"
                        >
                          Supprimer le PJ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="menu-section">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab((prev) => (prev === "npcs" ? null : "npcs"))
                }
                aria-expanded={rightPanelTab === "npcs"}
                aria-controls="right-panel-npcs"
                className={`menu-toggle relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
                  rightPanelTab === "npcs"
                    ? "border-amber-400 bg-[#7a4500] text-amber-50"
                    : "border-amber-600/60 bg-[#3d1f00] hover:bg-[#5a2e00] text-amber-100"
                }`}
              >
                {rightPanelTab === "npcs" && (
                  <span aria-hidden="true" className="absolute top-1 right-1">
                    <span
                      className="absolute inset-0 rounded-full bg-stone-1000/30 animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-stone-600 ring-2 ring-stone-300/70 shadow-[0_0_6px_rgba(180,83,9,0.35)]" />
                  </span>
                )}
                <span className="flex w-full flex-col items-center justify-center gap-1">
                  <span aria-hidden="true" className="text-base">
                    🎭
                  </span>
                  {!isRightPanelExpanded && (
                    <span className="text-[10px] font-semibold tracking-wide text-amber-200">
                      PNJ
                    </span>
                  )}
                  {isRightPanelExpanded && (
                    <span className="w-full truncate text-left text-xs font-medium text-amber-100">
                      PNJ
                    </span>
                  )}
                </span>
              </button>
              <div
                id="right-panel-npcs"
                role="region"
                aria-hidden={rightPanelTab !== "npcs"}
                className={`section-content relative mt-2 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                  rightPanelTab === "npcs"
                    ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
                    : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
                }`}
                style={{
                  maxHeight:
                    rightPanelTab === "npcs"
                      ? "calc(100vh - 72px - 140px)"
                      : 0,
                  boxShadow:
                    rightPanelTab === "npcs"
                      ? "0 8px 24px rgba(30,20,10,0.12)"
                      : "none",
                }}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-stone-500/10" />
                <div className="space-y-2 overflow-y-auto py-2">
                  {sessionNpcs.list.map((npc) => (
                    <button
                      key={npc.id}
                      type="button"
                      onClick={() => {
                        setQuickPlaceId(null);
                        setQuickItemId(null);
                        setQuickNpcId(npc.id);
                        setPanelMode("npc");
                      }}
                      className="w-full rounded-md border border-stone-300 bg-white/90 px-2 py-2 text-left text-sm hover:bg-stone-100"
                    >
                      <div className="font-medium">
                        {npc.name || "PNJ sans nom"}
                      </div>
                      <div className="text-xs text-stone-600">
                        {npc.role ||
                          (sessionNpcs.hasFallback
                            ? "Hors session"
                            : "Aucun rôle")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="menu-section">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab((prev) =>
                    prev === "places" ? null : "places",
                  )
                }
                aria-expanded={rightPanelTab === "places"}
                aria-controls="right-panel-places"
                className={`menu-toggle relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
                  rightPanelTab === "places"
                    ? "border-amber-400 bg-[#7a4500] text-amber-50"
                    : "border-amber-600/60 bg-[#3d1f00] hover:bg-[#5a2e00] text-amber-100"
                }`}
              >
                {rightPanelTab === "places" && (
                  <span aria-hidden="true" className="absolute top-1 right-1">
                    <span
                      className="absolute inset-0 rounded-full bg-stone-1000/30 animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-stone-600 ring-2 ring-stone-300/70 shadow-[0_0_6px_rgba(180,83,9,0.35)]" />
                  </span>
                )}
                <span className="flex w-full flex-col items-center justify-center gap-1">
                  <span aria-hidden="true" className="text-base">
                    📍
                  </span>
                  {!isRightPanelExpanded && (
                    <span className="text-[10px] font-semibold tracking-wide text-amber-200">
                      Li
                    </span>
                  )}
                  {isRightPanelExpanded && (
                    <span className="w-full truncate text-left text-xs font-medium text-amber-100">
                      Lieux
                    </span>
                  )}
                </span>
              </button>
              <div
                id="right-panel-places"
                role="region"
                aria-hidden={rightPanelTab !== "places"}
                className={`section-content relative mt-2 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                  rightPanelTab === "places"
                    ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
                    : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
                }`}
                style={{
                  maxHeight:
                    rightPanelTab === "places"
                      ? "calc(100vh - 72px - 140px)"
                      : 0,
                  boxShadow:
                    rightPanelTab === "places"
                      ? "0 8px 24px rgba(30,20,10,0.12)"
                      : "none",
                }}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-stone-500/10" />
                <div className="space-y-2 overflow-y-auto py-2">
                  {places.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => {
                        setQuickNpcId(null);
                        setQuickItemId(null);
                        setQuickPlaceId(place.id);
                        setPanelMode("place");
                      }}
                      className="w-full rounded-md border border-stone-300 bg-white/90 px-2 py-2 text-left text-sm hover:bg-stone-100"
                    >
                      <div className="font-medium">
                        {place.name || "Lieu sans nom"}
                      </div>
                      <div className="text-xs text-stone-600">
                        {place.region || "Lieu de campagne"}
                      </div>
                    </button>
                  ))}
                  {places.length === 0 && (
                    <p className="text-xs text-stone-600">
                      Aucun lieu disponible.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="menu-section">
              <button
                type="button"
                onClick={() =>
                  setRightPanelTab((prev) => (prev === "items" ? null : "items"))
                }
                aria-expanded={rightPanelTab === "items"}
                aria-controls="right-panel-items"
                className={`menu-toggle relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
                  rightPanelTab === "items"
                    ? "border-amber-400 bg-[#7a4500] text-amber-50"
                    : "border-amber-600/60 bg-[#3d1f00] hover:bg-[#5a2e00] text-amber-100"
                }`}
              >
                {rightPanelTab === "items" && (
                  <span aria-hidden="true" className="absolute top-1 right-1">
                    <span
                      className="absolute inset-0 rounded-full bg-stone-1000/30 animate-ping"
                      style={{ animationDuration: "1.6s" }}
                    />
                    <span className="relative block h-2.5 w-2.5 rounded-full bg-stone-600 ring-2 ring-stone-300/70 shadow-[0_0_6px_rgba(180,83,9,0.35)]" />
                  </span>
                )}
                <span className="flex w-full flex-col items-center justify-center gap-1">
                  <span aria-hidden="true" className="text-base">
                    🧰
                  </span>
                  {!isRightPanelExpanded && (
                    <span className="text-[10px] font-semibold tracking-wide text-amber-200">
                      Ob
                    </span>
                  )}
                  {isRightPanelExpanded && (
                    <span className="w-full truncate text-left text-xs font-medium text-amber-100">
                      Objets
                    </span>
                  )}
                </span>
              </button>
              <div
                id="right-panel-items"
                role="region"
                aria-hidden={rightPanelTab !== "items"}
                className={`section-content relative mt-2 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                  rightPanelTab === "items"
                    ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
                    : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
                }`}
                style={{
                  maxHeight:
                    rightPanelTab === "items"
                      ? "calc(100vh - 72px - 140px)"
                      : 0,
                  boxShadow:
                    rightPanelTab === "items"
                      ? "0 8px 24px rgba(30,20,10,0.12)"
                      : "none",
                }}
              >
                <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-stone-500/10" />
                <div className="space-y-2 overflow-y-auto py-2">
                  <button
                    type="button"
                    onClick={handleCreateItem}
                    className="btn btn-primary w-full"
                  >
                    Nouvel objet
                  </button>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setQuickNpcId(null);
                        setQuickPlaceId(null);
                        setQuickItemId(item.id);
                        setPanelMode("item");
                      }}
                      className="w-full rounded-md border border-stone-300 bg-stone-100 px-3 py-3 text-left text-stone-900 transition-colors duration-200 hover:bg-stone-200/60"
                    >
                      <div className="font-medium">
                        {item.name?.trim() || "Objet sans nom"}
                      </div>
                      <div className="text-xs text-stone-600">
                        {(item.linkedNpcIds?.length ?? 0)} PNJ liés •{" "}
                        {(item.linkedPlaceIds?.length ?? 0)} lieux liés
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <p className="text-xs text-stone-600">
                      Aucun objet disponible.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <>
          <div
            className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-black/25 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none"
            style={{
              pointerEvents: isQuickOpen ? "auto" : "none",
              opacity: isQuickOpen ? 1 : 0,
            }}
            onClick={() => {
              setPanelMode(null);
              setQuickNpcId(null);
              setQuickPlaceId(null);
              setQuickItemId(null);
            }}
            aria-hidden="true"
          />
          <aside
            className={`fixed inset-y-0 right-0 z-50 overflow-hidden bg-stone-200 border-l border-stone-300 shadow-2xl
        transform transition-transform duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none
        ${isQuickOpen ? "translate-x-0" : "translate-x-full"}`}
            aria-hidden={!isQuickOpen}
            style={{ pointerEvents: isQuickOpen ? "auto" : "none" }}
          >
            <div
              className={`h-full overflow-y-auto overflow-x-hidden w-[90vw] sm:w-[360px] lg:w-[420px]`}
            >
              <div
                className={`h-full p-4 transition-opacity duration-300 motion-reduce:transition-none motion-reduce:opacity-100 will-change-transform ${
                  isQuickOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="w-10">
                      {panelMode !== "search" && panelMode !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setPanelMode("search");
                            setQuickNpcId(null);
                            setQuickPlaceId(null);
                            setQuickItemId(null);
                          }}
                          className="btn btn-subtle text-sm"
                          aria-label="Retour à la recherche"
                        >
                          ←
                        </button>
                      )}
                    </div>
                    <h3 className="min-w-0 flex-1 break-words text-center text-lg font-semibold">
                      {panelMode === "search"
                        ? "Recherche (session)"
                        : quickItem
                          ? quickItem.name
                        : quickNpc
                          ? quickNpc.name
                          : quickPlace?.name}
                    </h3>
                    <div className="w-10 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setPanelMode(null);
                          setQuickNpcId(null);
                          setQuickPlaceId(null);
                          setQuickItemId(null);
                        }}
                        className="btn btn-subtle"
                        aria-label="Fermer la vue rapide"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
                {panelMode === "search" ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Rechercher une scène, un PNJ, un lieu, un objet..."
                        className="min-h-11 w-full rounded-md border border-stone-300 bg-white/80 px-3 py-2 text-base"
                      />
                      <div className="flex flex-wrap gap-2 text-xs">
                        {(
                          [
                            { id: "all", label: "Tout" },
                            { id: "scenes", label: "Scènes" },
                            { id: "npcs", label: "PNJ" },
                            { id: "places", label: "Lieux" },
                            { id: "items", label: "Objets" },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSearchScope(tab.id)}
                            className={`btn btn-subtle ${
                              searchScope === tab.id
                                ? "btn-active"
                                : "text-stone-600"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {searchScope === "places" && places.length === 0 && (
                        <p className="text-sm text-stone-700">
                          Aucun lieu disponible dans la campagne.
                        </p>
                      )}
                      {searchScope === "items" && items.length === 0 && (
                        <p className="text-sm text-stone-700">
                          Aucun objet disponible.
                        </p>
                      )}
                      {debouncedQuery.trim() === "" && (
                        <p className="text-sm text-stone-700">
                          Saisissez une recherche pour afficher les résultats.
                        </p>
                      )}
                      {debouncedQuery.trim() !== "" &&
                        (searchScope === "all" || searchScope === "scenes") &&
                        searchResults.scenes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Scènes</h4>
                            <ul className="space-y-2">
                              {searchResults.scenes.map((scene) => (
                                <li key={scene.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectScene(scene.id)}
                                    className="card card-compact w-full text-left text-sm hover:bg-stone-100"
                                  >
                                    <p className="font-medium">{scene.title}</p>
                                    {scene.snippet && (
                                      <p className="text-xs text-stone-600">
                                        {scene.snippet}
                                      </p>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {debouncedQuery.trim() !== "" &&
                        (searchScope === "all" || searchScope === "npcs") &&
                        searchResults.npcs.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">PNJ</h4>
                            <ul className="space-y-2">
                              {searchResults.npcs.map((npc) => (
                                <li key={npc.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickPlaceId(null);
                                      setQuickItemId(null);
                                      setQuickNpcId(npc.id);
                                      setPanelMode("npc");
                                    }}
                                    className="card card-compact w-full text-left text-sm hover:bg-stone-100"
                                  >
                                    <p className="font-medium">{npc.title}</p>
                                    {"subtitle" in npc && npc.subtitle && (
                                      <p className="text-xs text-stone-600">
                                        {npc.subtitle}
                                      </p>
                                    )}
                                    {npc.snippet && (
                                      <p className="text-xs text-stone-600">
                                        {npc.snippet}
                                      </p>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {debouncedQuery.trim() !== "" &&
                        (searchScope === "all" || searchScope === "places") &&
                        searchResults.places.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Lieux</h4>
                            <ul className="space-y-2">
                              {searchResults.places.map((place) => (
                                <li key={place.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickNpcId(null);
                                      setQuickItemId(null);
                                      setQuickPlaceId(place.id);
                                      setPanelMode("place");
                                    }}
                                    className="card card-compact w-full text-left text-sm hover:bg-stone-100"
                                  >
                                    <p className="font-medium">{place.title}</p>
                                    {"subtitle" in place && place.subtitle && (
                                      <p className="text-xs text-stone-600">
                                        {place.subtitle}
                                      </p>
                                    )}
                                    {place.snippet && (
                                      <p className="text-xs text-stone-600">
                                        {place.snippet}
                                      </p>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {debouncedQuery.trim() !== "" &&
                        (searchScope === "all" || searchScope === "items") &&
                        searchResults.items.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Objets</h4>
                            <ul className="space-y-2">
                              {searchResults.items.map((entry) => (
                                <li key={entry.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickNpcId(null);
                                      setQuickPlaceId(null);
                                      setQuickItemId(entry.id);
                                      setPanelMode("item");
                                    }}
                                    className="card card-compact w-full text-left text-sm hover:bg-stone-100"
                                  >
                                    <p className="font-medium">{entry.title}</p>
                                    {"subtitle" in entry && entry.subtitle && (
                                      <p className="text-xs text-stone-600">
                                        {entry.subtitle}
                                      </p>
                                    )}
                                    {entry.snippet && (
                                      <p className="text-xs text-stone-600">
                                        {entry.snippet}
                                      </p>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {debouncedQuery.trim() !== "" &&
                        searchResults.scenes.length === 0 &&
                        searchResults.npcs.length === 0 &&
                        searchResults.places.length === 0 &&
                        searchResults.items.length === 0 && (
                          <p className="text-sm text-stone-700">
                            Aucun résultat trouvé.
                          </p>
                        )}
                    </div>
                  </div>
                ) : panelMode === "npc" && quickNpc ? (
                  <div className="live-quick-panel">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-stone-600">
                        {quickNpc.role || "Aucun rôle"}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          attitudeStyles[quickNpc.attitude] ??
                          attitudeStyles.neutral
                        }`}
                      >
                        {quickNpc.attitude}
                      </span>
                    </div>
                    {quickNpc.description && (
                      <p className="mt-3 text-sm text-stone-700">
                        {quickNpc.description}
                      </p>
                    )}
                    {quickNpc.notes && (
                      <p className="mt-2 text-sm text-stone-700">
                        {quickNpc.notes}
                      </p>
                    )}
                  </div>
                ) : panelMode === "place" && quickPlace ? (
                  <div className="live-quick-panel">
                    {quickPlace.region && (
                      <p className="text-xs text-stone-600">
                        {quickPlace.region}
                      </p>
                    )}
                    {quickPlace.description && (
                      <p className="mt-3 break-words whitespace-normal text-sm text-stone-700">
                        {quickPlace.description}
                      </p>
                    )}
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70 font-cinzel">
                        Scènes (session courante)
                      </p>
                      {quickPlaceScenes.currentSession.length > 0 ? (
                        <ul className="space-y-2">
                          {quickPlaceScenes.currentSession.map(({ scene }) => (
                            <li key={scene.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectScene(scene.id)}
                                className="card card-compact w-full text-left text-sm hover:bg-stone-100"
                              >
                                <p className="font-medium">
                                  {scene.title || "Scène sans titre"}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-stone-700">
                          Aucune scène liée dans cette session.
                        </p>
                      )}
                      {quickPlaceScenes.otherCount > 0 && (
                        <p className="text-xs text-stone-600">
                          Utilisé dans {quickPlaceScenes.otherCount} autre
                          {quickPlaceScenes.otherCount > 1 ? "s" : ""} scène
                          {quickPlaceScenes.otherCount > 1 ? "s" : ""} de la
                          campagne.
                        </p>
                      )}
                    </div>
                  </div>
                ) : panelMode === "item" && quickItem ? (
                  <div className="live-quick-panel space-y-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPanelMode("item-edit")}
                        className="btn btn-subtle text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Supprimer cet objet ?",
                          );
                          if (!confirmed) {
                            return;
                          }
                          handleDeleteItem(quickItem.id);
                        }}
                        className="btn btn-danger text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                    <ItemDetail
                      item={quickItem}
                      npcs={data.npcs}
                      places={places}
                      onOpenNpc={(npcId) => {
                        setQuickItemId(null);
                        setQuickPlaceId(null);
                        setQuickNpcId(npcId);
                        setPanelMode("npc");
                      }}
                      onOpenPlace={(placeId) => {
                        setQuickItemId(null);
                        setQuickNpcId(null);
                        setQuickPlaceId(placeId);
                        setPanelMode("place");
                      }}
                    />
                  </div>
                ) : panelMode === "item-edit" && quickItem ? (
                  <div className="live-quick-panel space-y-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPanelMode("item")}
                        className="btn btn-subtle text-sm"
                      >
                        Aperçu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Supprimer cet objet ?",
                          );
                          if (!confirmed) {
                            return;
                          }
                          handleDeleteItem(quickItem.id);
                        }}
                        className="btn btn-danger text-sm"
                      >
                        Supprimer
                      </button>
                    </div>
                    <div className="rounded-md border border-stone-300 bg-gradient-to-b from-stone-100 to-stone-200 p-4 shadow-sm text-stone-800">
                      <ItemEditor
                        item={quickItem}
                        npcs={data.npcs}
                        places={places}
                        onUpdate={(fields) => {
                          updateItem(quickItem.id, fields);
                          setItems((prev) =>
                            prev.map((item) =>
                              item.id === quickItem.id
                                ? { ...item, ...fields }
                                : item,
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </>
    </section>
  );
}
