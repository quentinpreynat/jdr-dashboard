import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

const attitudeStyles: Record<string, string> = {
  friendly: "badge badge-friendly",
  neutral: "badge badge-neutral",
  wary: "badge badge-wary",
  hostile: "badge badge-hostile"
};

type SearchScope = "all" | "scenes" | "npcs" | "places";
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
    };

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function makeSnippet(value: string, query: string, maxLength: number = 120): string | undefined {
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
    updateScene,
    createPlayerCharacter,
    updatePlayerCharacter,
    deletePlayerCharacter,
    findCampaignBySessionId
  } = useAppData();
  const containerRef = useRef<HTMLElement | null>(null);
  const noteInputRef = useRef<HTMLInputElement | null>(null);
  const scenePanelRef = useRef<HTMLDivElement | null>(null);
  const session = data.sessions.find((entry) => entry.id === sessionId);
  const campaign = sessionId ? findCampaignBySessionId(sessionId) : null;
  const places = campaign?.places ?? [];

  const orderedScenes = useMemo(() => {
    if (!session) {
      return [];
    }
    return [...session.scenes].sort((a, b) => a.order - b.order);
  }, [session]);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    orderedScenes[0]?.id ?? null
  );
  const [noteText, setNoteText] = useState("");
  const [clockLabel, setClockLabel] = useState(() =>
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
  const [rightPanelTab, setRightPanelTab] = useState<"scenes" | "npcs" | "places" | "pcs" | null>(
    null
  );
  const RIGHT_PANEL_COLLAPSED_PX = 70;
  const RIGHT_PANEL_EXPANDED_PX = 140;
  const RIGHT_PANEL_PCS_PX = 360;
  const isRightPanelExpanded = rightPanelTab !== null;
  const rightPanelWidth =
    rightPanelTab === "pcs"
      ? RIGHT_PANEL_PCS_PX
      : isRightPanelExpanded
        ? RIGHT_PANEL_EXPANDED_PX
        : RIGHT_PANEL_COLLAPSED_PX;
  const [selectedPcId, setSelectedPcId] = useState<string | null>(null);
  const [pcConditionDraft, setPcConditionDraft] = useState("");
  const [isCombatMode, setIsCombatMode] = useState(false);
  const [isDimMode] = useState(() => {
    try {
      return localStorage.getItem("tor-live-dim-enabled") === "true";
    } catch {
      return false;
    }
  });
  const [noteTargetSceneId, setNoteTargetSceneId] = useState<string | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [quickNpcId, setQuickNpcId] = useState<string | null>(null);
  const [quickPlaceId, setQuickPlaceId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"npc" | "place" | "search" | null>(null);
  const [flashSceneId, setFlashSceneId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!selectedSceneId && orderedScenes[0]) {
      setSelectedSceneId(orderedScenes[0].id);
      return;
    }
    if (selectedSceneId && !orderedScenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(orderedScenes[0]?.id ?? null);
    }
  }, [orderedScenes, selectedSceneId]);

  useEffect(() => {
    const updateClock = () =>
      setClockLabel(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    console.info("[SessionLive] mounted", { sessionId });
  }, [sessionId]);

  useEffect(() => {
    if (panelMode === "search") {
      const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 150);
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

  const selectedScene = orderedScenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const selectedIndex = selectedSceneId
    ? orderedScenes.findIndex((scene) => scene.id === selectedSceneId)
    : -1;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < orderedScenes.length - 1;
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
    return { list: data.npcs.filter((npc) => linkedNpcIds.has(npc.id)), hasFallback: false };
  }, [data.npcs, linkedNpcIds]);
  const pcs = data.pcs ?? [];
  const selectedPc = selectedPcId ? pcs.find((pc) => pc.id === selectedPcId) ?? null : null;
  const [usedChoiceIds, setUsedChoiceIds] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!selectedScene) {
      setNoteTargetSceneId(null);
      lastSceneIdRef.current = null;
      return;
    }
    if (lastSceneIdRef.current !== selectedScene.id) {
      const nextScene = hasNext ? orderedScenes[selectedIndex + 1] : null;
      setNoteTargetSceneId(nextScene?.id ?? selectedScene.id);
      lastSceneIdRef.current = selectedScene.id;
    }
  }, [selectedScene, hasNext, orderedScenes, selectedIndex]);
 
  useEffect(() => {
    if (!selectedPcId) {
      return;
    }
    if (!pcs.some((pc) => pc.id === selectedPcId)) {
      setSelectedPcId(null);
    }
  }, [pcs, selectedPcId]);
  
  useEffect(() => {
    setPcConditionDraft("");
  }, [selectedPcId]);
  

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Keyboard shortcuts are scoped to the page and avoid direct modal control here.
      if (event.key === "ArrowLeft") {
        if (hasPrev) {
          setSelectedSceneId(orderedScenes[selectedIndex - 1].id);
        }
      } else if (event.key === "ArrowRight") {
        if (hasNext) {
          setSelectedSceneId(orderedScenes[selectedIndex + 1].id);
        }
      } else if (event.key.toLowerCase() === "n") {
        noteInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, orderedScenes, selectedIndex]);
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    let startX: number | null = null;
    const onPointerDown = (event: PointerEvent) => {
      startX = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (startX === null) {
        return;
      }
      const dx = event.clientX - startX;
      const threshold = 60;
      if (dx > threshold && hasPrev) {
        setSelectedSceneId(orderedScenes[selectedIndex - 1].id);
      } else if (dx < -threshold && hasNext) {
        setSelectedSceneId(orderedScenes[selectedIndex + 1].id);
      }
      startX = null;
    };
    // Simple horizontal swipe, avoids interfering with modal clicks.
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
    };
  }, [orderedScenes, selectedIndex, hasPrev, hasNext]);

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
      ? `Scène ${selectedScene.order}`
      : "Scène";
  const selectedPlace = selectedScene?.placeId
    ? places.find((place) => place.id === selectedScene.placeId) ?? null
    : null;

  const searchResults = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed || !session) {
      return { scenes: [] as SearchResult[], npcs: [] as SearchResult[], places: [] as SearchResult[] };
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
        title: scene.title?.trim() || `Scène ${scene.order}`,
        snippet: makeSnippet(scene.text, trimmed)
      }));

    const npcResults: SearchResult[] = sessionNpcs.list
      .filter((npc) => {
        const haystack = [
          npc.name,
          npc.role,
          npc.description,
          npc.notes,
          npc.locationText
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((npc) => ({
        id: npc.id,
        type: "npc",
        title: npc.name || "PNJ sans nom",
        subtitle: npc.role || (sessionNpcs.hasFallback ? "Hors session" : "Aucun rôle"),
        snippet:
          makeSnippet(npc.description, trimmed) ??
          makeSnippet(npc.notes, trimmed) ??
          makeSnippet(npc.locationText, trimmed)
      }));

    const placeResults: SearchResult[] = places
      .filter((place) => {
        const haystack = [place.name, place.region, place.description].filter(Boolean).join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((place) => ({
        id: place.id,
        type: "place",
        title: place.name || "Lieu sans nom",
        subtitle: place.region || "Lieu de campagne",
        snippet: makeSnippet(place.description ?? "", trimmed)
      }));

    return { scenes: sceneResults, npcs: npcResults, places: placeResults };
  }, [debouncedQuery, session, sessionNpcs, places]);

  const quickNpc = quickNpcId ? data.npcs.find((npc) => npc.id === quickNpcId) : null;
  const quickPlace = quickPlaceId ? places.find((place) => place.id === quickPlaceId) : null;
  const isQuickOpen = panelMode !== null;
  const quickPlaceScenes = useMemo(() => {
    if (!quickPlace) {
      return { currentSession: [], otherCount: 0 };
    }
    const all = data.sessions.flatMap((entry) =>
      entry.scenes
        .filter((scene) => scene.placeId === quickPlace.id)
        .map((scene) => ({ session: entry, scene }))
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
    window.setTimeout(() => setFlashSceneId(null), 800);
  }

  return (
    <section
      ref={containerRef}
      className={`session-live h-screen w-full overflow-x-hidden ${isDimMode ? "is-dim" : ""}`}
    >
      <div className="space-y-6 py-5">
        <header className="flex flex-wrap items-center justify-between gap-3 px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60">Session Live</p>
          <h2 className="text-2xl font-semibold">{session.title || "Session sans titre"}</h2>
          <p className="text-sm text-amber-950/70">{session.objective || "Aucun objectif défini."}</p>
          {session.openingText && (
            <p className="mt-2 max-w-2xl text-sm italic text-amber-950/70">{session.openingText}</p>
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
          <Link to={`/sessions/${sessionId}`} className="btn btn-subtle">
            Retour aux détails
          </Link>
        </div>
      </header>
      
        <div
          className="live-layout mx-auto w-full max-w-[1200px] min-w-0 px-6"
          style={{
            paddingRight: rightPanelWidth
          }}
        >
          <div
            ref={scenePanelRef}
            className="scene-panel card card-muted flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out"
          >
          <div className="fade-in flex min-h-0 flex-col" key={selectedScene?.id ?? "empty"}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70">Scène sélectionnée</p>
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-semibold">{selectedSceneTitle}</h4>
                </div>
                {selectedPlace && (
                  <button
                    type="button"
                    onClick={() => {
                      console.info("[Live] open place quick view", selectedPlace.id);
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

            <div className="mt-4 flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
              <section className="live-card space-y-2 p-4 sm:p-5">
                <p className="live-label">Texte de scène</p>
                <h5 className="text-base font-semibold">{selectedSceneTitle}</h5>
                <div className="parchment-text text-sm live-muted whitespace-pre-line">
                  {selectedScene?.text || "Aucun texte pour le moment."}
                </div>
              </section>

              <section className="rounded-lg border border-amber-900/10 bg-white/40 p-3 sm:p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/60">Choix</p>
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
                      ? "min-h-[140px] text-[17px] px-6 py-6"
                      : count <= 4
                        ? "min-h-[120px] text-base px-5 py-5"
                        : count <= 6
                          ? "min-h-[104px] text-sm px-4 py-4"
                          : "min-h-[92px] text-sm px-3 py-3";
                  const innerClass =
                    count <= 2
                      ? "gap-3"
                      : count <= 4
                        ? "gap-2"
                        : "gap-1.5";
                  return (
                    <div className={gridClass}>
                      {choices.map((choice) => {
                        const hasLinkedScene =
                          choice.targetType === "place" &&
                          orderedScenes.some(
                            (scene) => scene.id !== selectedScene?.id && scene.placeId === choice.targetId
                          );
                        const usedIds = usedChoiceIds[selectedScene?.id ?? ""] ?? [];
                        const isUsed = usedIds.includes(choice.id);
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            className={`group relative flex w-full items-center justify-center rounded-[10px] border border-amber-900/30 bg-[#F2E3C6] text-center font-medium text-amber-950/90 shadow-[0_6px_14px_rgba(67,41,21,0.12)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(67,41,21,0.18)] ${cardClass} ${
                              isUsed ? "opacity-75 text-amber-950/60" : ""
                            }`}
                            onClick={() => {
                              if (choice.targetType === "place") {
                                setQuickPlaceId(choice.targetId);
                                setPanelMode("place");
                              } else if (choice.targetType === "npc") {
                                setQuickNpcId(choice.targetId);
                                setPanelMode("npc");
                              }
                              if (selectedScene) {
                                setUsedChoiceIds((prev) => {
                                  const sceneKey = selectedScene.id;
                                  const next = new Set(prev[sceneKey] ?? []);
                                  next.add(choice.id);
                                  return { ...prev, [sceneKey]: Array.from(next) };
                                });
                              }
                            }}
                          >
                            <span className="absolute inset-0 rounded-[10px] opacity-[0.25] mix-blend-multiply [background-image:repeating-linear-gradient(45deg,rgba(120,74,32,0.06)_0px,rgba(120,74,32,0.06)_1px,transparent_1px,transparent_6px)]" />
                            <span className={`relative flex flex-col items-center justify-center ${innerClass}`}>
                              <span className="text-sm text-amber-900/70" aria-hidden="true">
                                {choice.targetType === "place" ? "📍" : "🎭"}
                              </span>
                              <span className="max-w-full text-center leading-snug tracking-wide">
                                {choice.label}
                              </span>
                              {hasLinkedScene && (
                                <span className="text-xs text-amber-900/60">➜</span>
                              )}
                            </span>
                            {isUsed && (
                              <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-amber-900/50">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {(selectedScene?.choices?.length ?? 0) === 0 && (
                        <p className="rounded-md border border-amber-900/10 bg-white/50 px-3 py-2 text-sm live-muted">
                          Aucun choix défini.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </section>
              
              <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-lg border border-amber-900/10 bg-white/40 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/60">
                    Personnages
                  </p>
                  <div className="mt-2 space-y-2">
                    {linkedNpcs.map((npc) => (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickNpcId(npc.id);
                          setPanelMode("npc");
                        }}
                        key={npc.id}
                        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-amber-900/10 bg-white/60 px-3 py-2 text-left text-sm hover:bg-amber-50/60"
                      >
                        <div>
                          <p className="font-medium">{npc.name || "PNJ sans nom"}</p>
                          <p className="text-xs live-muted">{npc.role || "Aucun rôle"}</p>
                        </div>
                        <span className={attitudeStyles[npc.attitude] ?? attitudeStyles.neutral}>
                          {npc.attitude}
                        </span>
                      </button>
                    ))}
                    {linkedNpcs.length === 0 && (
                      <p className="rounded-md border border-amber-900/10 bg-white/50 px-3 py-2 text-sm live-muted">
                        Aucun personnage lié à cette scène.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border border-amber-900/10 bg-white/40 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/60">
                      Notes
                    </p>
                  </div>
                  <div className="mt-2 flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1">
                    {selectedScene?.liveNotes?.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-amber-900/10 bg-white/60 px-3 py-2 text-sm"
                      >
                        {(() => {
                          const sourceScene = orderedScenes.find(
                            (scene) => scene.id === note.createdFromSceneId
                          );
                          const sourceLabel = sourceScene
                            ? sourceScene.title?.trim() || `Scène ${sourceScene.order}`
                            : note.createdFromSceneId
                              ? "(scène supprimée)"
                              : selectedSceneTitle;
                          const labelText =
                            sourceLabel === selectedSceneTitle
                              ? `Depuis: ${selectedSceneTitle}`
                              : `Depuis: ${sourceLabel}`;
                          return (
                            <p className="text-xs live-muted">
                              {new Date(note.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}{" "}
                              — <span className="font-medium">{labelText}</span> — {note.text}
                            </p>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            if (!sessionId || !selectedScene) {
                              return;
                            }
                            const confirmed = window.confirm("Supprimer cette note ?");
                            if (!confirmed) {
                              return;
                            }
                            removeSceneLiveNote(sessionId, selectedScene.id, note.id);
                          }}
                          className="btn btn-subtle text-xs"
                          aria-label="Supprimer la note"
                        >
                          Supprimer
                        </button>
                      </div>

                    ))}
                    {(selectedScene?.liveNotes?.length ?? 0) === 0 && (
                      <p className="rounded-md border border-amber-900/10 bg-white/50 px-3 py-2 text-sm live-muted">
                        Aucune note pour le moment.
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-shrink-0 flex-col gap-2 lg:flex-row">
                    <label className="flex min-h-11 items-center gap-2 text-xs live-muted">
                      Ajouter à :
                      <select
                        value={noteTargetSceneId ?? ""}
                        onChange={(event) => setNoteTargetSceneId(event.target.value || null)}
                        className="live-input min-h-11 w-44 flex-shrink-0 rounded-md px-3 py-2 text-sm"
                      >
                        {orderedScenes.map((scene, index) => {
                          const title = scene.title?.trim() || `Scène ${scene.order}`;
                          const label =
                            selectedScene && hasNext && index === selectedIndex + 1
                              ? `Scène suivante — ${title}`
                              : title;
                          return (
                            <option key={scene.id} value={scene.id}>
                              {label}
                            </option>
                          );
                        })}
                        {orderedScenes.length === 0 && <option value="">Aucune scène</option>}
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
                      className="btn btn-primary flex-shrink-0"
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
      <div
        className="fixed right-0 top-[72px] z-40 h-[calc(100vh-72px)] border-l border-amber-900/20 bg-[#E7D8BF]/70 backdrop-blur-sm flex flex-col p-3"
        style={{
          width: rightPanelWidth,
          transition: "width 240ms ease"
        }}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setRightPanelTab((prev) => (prev === "scenes" ? null : "scenes"))}
            aria-expanded={rightPanelTab === "scenes"}
            aria-controls="right-panel-scenes"
            className={`relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
              rightPanelTab === "scenes"
                ? "border-amber-900/60 bg-amber-50"
                : "border-amber-900/20 bg-[#F2E7D4] hover:bg-amber-50"
            }`}
          >
            {rightPanelTab === "scenes" && (
              <span aria-hidden="true" className="absolute top-1 right-1">
                <span
                  className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping"
                  style={{ animationDuration: "1.6s" }}
                />
                <span
                  className="relative block h-2.5 w-2.5 rounded-full bg-amber-700 ring-2 ring-amber-300/60 shadow-[0_0_6px_rgba(180,83,9,0.35)]"
                />
              </span>
            )}
            <span className="flex w-full flex-col items-center justify-center gap-1">
              <span aria-hidden="true" className="text-base">
                🎬
              </span>
              {!isRightPanelExpanded && (
                <span className="text-[10px] font-semibold tracking-wide text-amber-900/70">
                  Sc
                </span>
              )}
              {isRightPanelExpanded && (
                <span className="w-full truncate text-left text-xs font-medium text-amber-950/80">
                  Scènes
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab((prev) => (prev === "pcs" ? null : "pcs"))}
            aria-expanded={rightPanelTab === "pcs"}
            aria-controls="right-panel-pcs"
            className={`relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
              rightPanelTab === "pcs"
                ? "border-amber-900/60 bg-amber-50"
                : "border-amber-900/20 bg-[#F2E7D4] hover:bg-amber-50"
            }`}
          >
            {rightPanelTab === "pcs" && (
              <span aria-hidden="true" className="absolute top-1 right-1">
                <span
                  className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping"
                  style={{ animationDuration: "1.6s" }}
                />
                <span
                  className="relative block h-2.5 w-2.5 rounded-full bg-amber-700 ring-2 ring-amber-300/60 shadow-[0_0_6px_rgba(180,83,9,0.35)]"
                />
              </span>
            )}
            <span className="flex w-full flex-col items-center justify-center gap-1">
              <span aria-hidden="true" className="text-base">
                🧝
              </span>
              {!isRightPanelExpanded && (
                <span className="text-[10px] font-semibold tracking-wide text-amber-900/70">
                  PJ
                </span>
              )}
              {isRightPanelExpanded && (
                <span className="w-full truncate text-left text-xs font-medium text-amber-950/80">
                  PJ
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab((prev) => (prev === "npcs" ? null : "npcs"))}
            aria-expanded={rightPanelTab === "npcs"}
            aria-controls="right-panel-npcs"
            className={`relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
              rightPanelTab === "npcs"
                ? "border-amber-900/60 bg-amber-50"
                : "border-amber-900/20 bg-[#F2E7D4] hover:bg-amber-50"
            }`}
          >
            {rightPanelTab === "npcs" && (
              <span aria-hidden="true" className="absolute top-1 right-1">
                <span
                  className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping"
                  style={{ animationDuration: "1.6s" }}
                />
                <span
                  className="relative block h-2.5 w-2.5 rounded-full bg-amber-700 ring-2 ring-amber-300/60 shadow-[0_0_6px_rgba(180,83,9,0.35)]"
                />
              </span>
            )}
            <span className="flex w-full flex-col items-center justify-center gap-1">
              <span aria-hidden="true" className="text-base">
                🎭
              </span>
              {!isRightPanelExpanded && (
                <span className="text-[10px] font-semibold tracking-wide text-amber-900/70">
                  PNJ
                </span>
              )}
              {isRightPanelExpanded && (
                <span className="w-full truncate text-left text-xs font-medium text-amber-950/80">
                  PNJ
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRightPanelTab((prev) => (prev === "places" ? null : "places"))}
            aria-expanded={rightPanelTab === "places"}
            aria-controls="right-panel-places"
            className={`relative w-full rounded-md border px-2 py-2 text-xs font-medium shadow-sm transition ${
              rightPanelTab === "places"
                ? "border-amber-900/60 bg-amber-50"
                : "border-amber-900/20 bg-[#F2E7D4] hover:bg-amber-50"
            }`}
          >
            {rightPanelTab === "places" && (
              <span aria-hidden="true" className="absolute top-1 right-1">
                <span
                  className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping"
                  style={{ animationDuration: "1.6s" }}
                />
                <span
                  className="relative block h-2.5 w-2.5 rounded-full bg-amber-700 ring-2 ring-amber-300/60 shadow-[0_0_6px_rgba(180,83,9,0.35)]"
                />
              </span>
            )}
            <span className="flex w-full flex-col items-center justify-center gap-1">
              <span aria-hidden="true" className="text-base">
                📍
              </span>
              {!isRightPanelExpanded && (
                <span className="text-[10px] font-semibold tracking-wide text-amber-900/70">
                  Li
                </span>
              )}
              {isRightPanelExpanded && (
                <span className="w-full truncate text-left text-xs font-medium text-amber-950/80">
                  Lieux
                </span>
              )}
            </span>
          </button>
        </div>
        <div
          id="right-panel-scenes"
          role="region"
          aria-hidden={rightPanelTab !== "scenes"}
          className={`relative mt-3 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            rightPanelTab === "scenes"
              ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
              : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
          }`}
          style={{
            maxHeight: rightPanelTab === "scenes" ? "calc(100vh - 72px - 140px)" : 0,
            boxShadow: rightPanelTab === "scenes" ? "0 8px 24px rgba(30,20,10,0.12)" : "none"
          }}
        >
          <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-amber-900/10" />
          <div className="space-y-2 py-2">
            {orderedScenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneId(scene.id)}
                className={`w-full rounded-md border px-2 py-2 text-left text-sm ${
                  scene.id === selectedSceneId
                    ? "border-amber-900/60 bg-amber-50"
                    : "border-amber-900/20 bg-white/90 hover:bg-amber-50"
                } ${flashSceneId === scene.id ? "flash-ring" : ""}`}
              >
                <div className="font-medium">{scene.title || `Scène ${scene.order}`}</div>
                {(scene.liveNotes?.length ?? 0) > 0 && (
                  <div className="mt-1 text-xs text-amber-900/60">
                    📝 Notes : {scene.liveNotes?.length ?? 0}
                  </div>
                )}
                {(scene.linkedNpcIds?.length ?? 0) > 0 && (
                  <div className="text-xs text-amber-900/60">
                    🎭 PNJ : {scene.linkedNpcIds.length}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div
          id="right-panel-pcs"
          role="region"
          aria-hidden={rightPanelTab !== "pcs"}
          className={`relative mt-3 origin-top overflow-hidden transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            rightPanelTab === "pcs"
              ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
              : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
          }`}
          style={{
            maxHeight: rightPanelTab === "pcs" ? "calc(100vh - 72px - 140px)" : 0,
            boxShadow: rightPanelTab === "pcs" ? "0 8px 24px rgba(30,20,10,0.12)" : "none"
          }}
        >
          <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-amber-900/10" />
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/60">
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
              <div className="relative rounded-xl border border-amber-900/20 bg-[#F2E3C6] p-3 shadow-[0_8px_18px_rgba(62,38,19,0.12)]">
                <div className="pointer-events-none absolute inset-y-3 left-1/2 hidden w-px -translate-x-1/2 bg-amber-900/15 lg:block" />
                <div
                  className={`grid gap-3 ${
                    isCombatMode ? "sm:grid-cols-2 lg:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {pcs.map((pc) => {
                    const hpMax = Math.max(0, pc.hpMax);
                    const hpCurrent = Math.max(0, Math.min(pc.hpCurrent, hpMax || pc.hpCurrent));
                    const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 0;
                    const isLow = hpMax > 0 && hpRatio < 0.3;
                    return (
                      <button
                        key={pc.id}
                        type="button"
                        onClick={() => setSelectedPcId(pc.id)}
                        className={`text-left rounded-lg border border-amber-900/20 bg-white/70 px-3 py-3 shadow-[0_4px_10px_rgba(62,38,19,0.12)] transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_14px_rgba(62,38,19,0.18)] ${
                          selectedPcId === pc.id ? "ring-1 ring-amber-500/40" : ""
                        } ${isCombatMode ? "px-2 py-2" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-amber-950/90">{pc.name}</p>
                            <p className="text-xs text-amber-900/70">{pc.role || "Sans rôle"}</p>
                          </div>
                          <span className="text-[10px] text-amber-900/60">🧝</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-amber-950/80">
                            <span className={isLow ? "text-amber-900/80" : ""}>PV</span>
                            <span className={isLow ? "text-amber-900/90" : ""}>
                              {hpCurrent} / {hpMax || "—"}
                            </span>
                          </div>
                          <div
                            className={`mt-1 w-full rounded-full bg-amber-900/10 ${
                              isCombatMode ? "h-2.5" : "h-1.5"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full ${
                                isLow ? "bg-amber-900/50" : "bg-amber-800/40"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, hpRatio * 100))}%` }}
                            />
                          </div>
                        </div>
                        <div
                          className={`mt-2 flex flex-wrap gap-1 text-[10px] ${
                            isCombatMode ? "text-amber-900/80" : "text-amber-900/70 min-h-[18px]"
                          }`}
                        >
                          {pc.conditions.map((condition) => (
                            <span
                              key={condition}
                              className="rounded-full border border-amber-900/20 bg-amber-50/60 px-2 py-0.5"
                            >
                              {condition}
                            </span>
                          ))}
                          {pc.conditions.length === 0 && !isCombatMode && (
                            <span className="text-amber-900/40">Aucun état</span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-amber-900/80">
                          {[
                            { key: "for", label: "FOR" },
                            { key: "dex", label: "DEX" },
                            { key: "int", label: "INT" },
                            { key: "con", label: "CON" }
                          ].map((stat) => (
                            <div key={stat.key} className="flex flex-col items-center">
                              <span className="font-semibold">{stat.label}</span>
                              <span>{pc.stats[stat.key as keyof typeof pc.stats]}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                  {pcs.length === 0 && (
                    <p className="col-span-full rounded-md border border-amber-900/10 bg-white/70 px-3 py-2 text-sm text-amber-900/70">
                      Aucun PJ enregistré.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {selectedPc && (
              <div className="rounded-xl border border-amber-900/20 bg-[#F2E3C6] p-3 shadow-[0_6px_14px_rgba(62,38,19,0.14)] transition-all duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-900/60">Fiche PJ</p>
                    <p className="text-sm font-semibold text-amber-950/90">{selectedPc.name}</p>
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
                    onChange={(event) => updatePlayerCharacter(selectedPc.id, { name: event.target.value })}
                    className="w-full rounded-md border border-amber-900/20 bg-white/70 px-3 py-2 text-sm"
                    placeholder="Nom du PJ"
                  />
                  <input
                    value={selectedPc.role}
                    onChange={(event) => updatePlayerCharacter(selectedPc.id, { role: event.target.value })}
                    className="w-full rounded-md border border-amber-900/20 bg-white/70 px-3 py-2 text-sm"
                    placeholder="Classe / rôle"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updatePlayerCharacter(selectedPc.id, {
                          hpCurrent: Math.max(0, selectedPc.hpCurrent - 1)
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
                        updatePlayerCharacter(selectedPc.id, { hpCurrent: Number(event.target.value) })
                      }
                      className="w-20 rounded-md border border-amber-900/20 bg-white/70 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-amber-900/70">/</span>
                    <input
                      type="number"
                      value={selectedPc.hpMax}
                      onChange={(event) =>
                        updatePlayerCharacter(selectedPc.id, { hpMax: Number(event.target.value) })
                      }
                      className="w-20 rounded-md border border-amber-900/20 bg-white/70 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updatePlayerCharacter(selectedPc.id, {
                          hpCurrent: Math.min(selectedPc.hpMax, selectedPc.hpCurrent + 1)
                        })
                      }
                      className="btn btn-subtle px-2 text-xs"
                    >
                      +
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      { key: "for", label: "FOR" },
                      { key: "dex", label: "DEX" },
                      { key: "int", label: "INT" },
                      { key: "con", label: "CON" }
                    ] as const).map((stat) => (
                      <label key={stat.key} className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-amber-900/70">{stat.label}</span>
                        <input
                          type="number"
                          value={selectedPc.stats[stat.key]}
                          onChange={(event) =>
                            updatePlayerCharacter(selectedPc.id, {
                              stats: {
                                ...selectedPc.stats,
                                [stat.key]: Number(event.target.value)
                              }
                            })
                          }
                          className="w-16 rounded-md border border-amber-900/20 bg-white/70 px-2 py-1 text-xs"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {selectedPc.conditions.map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() =>
                            updatePlayerCharacter(selectedPc.id, {
                              conditions: selectedPc.conditions.filter((entry) => entry !== condition)
                            })
                          }
                          className="rounded-full border border-amber-900/20 bg-amber-50/60 px-2 py-1 text-amber-900/70"
                        >
                          {condition} ✕
                        </button>
                      ))}
                      {selectedPc.conditions.length === 0 && (
                        <span className="text-amber-900/40">Aucun état</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={pcConditionDraft}
                        onChange={(event) => setPcConditionDraft(event.target.value)}
                        placeholder="Ajouter un état..."
                        className="flex-1 rounded-md border border-amber-900/20 bg-white/70 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = pcConditionDraft.trim();
                          if (!trimmed) {
                            return;
                          }
                          updatePlayerCharacter(selectedPc.id, {
                            conditions: Array.from(new Set([...selectedPc.conditions, trimmed]))
                          });
                          setPcConditionDraft("");
                        }}
                        className="btn btn-subtle px-2 text-xs"
                      >
                        Ajouter
                      </button>
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
        <div
          id="right-panel-npcs"
          role="region"
          aria-hidden={rightPanelTab !== "npcs"}
          className={`relative mt-3 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            rightPanelTab === "npcs"
              ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
              : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
          }`}
          style={{
            maxHeight: rightPanelTab === "npcs" ? "calc(100vh - 72px - 140px)" : 0,
            boxShadow: rightPanelTab === "npcs" ? "0 8px 24px rgba(30,20,10,0.12)" : "none"
          }}
        >
          <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-amber-900/10" />
          <div className="space-y-2 py-2">
            {sessionNpcs.list.map((npc) => (
              <button
                key={npc.id}
                type="button"
                onClick={() => {
                  setQuickNpcId(npc.id);
                  setPanelMode("npc");
                }}
                className="w-full rounded-md border border-amber-900/20 bg-white/90 px-2 py-2 text-left text-sm hover:bg-amber-50"
              >
                <div className="font-medium">{npc.name || "PNJ sans nom"}</div>
                <div className="text-xs text-amber-900/60">
                  {npc.role || (sessionNpcs.hasFallback ? "Hors session" : "Aucun rôle")}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div
          id="right-panel-places"
          role="region"
          aria-hidden={rightPanelTab !== "places"}
          className={`relative mt-3 origin-top overflow-hidden pr-1 transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
            rightPanelTab === "places"
              ? "pointer-events-auto scale-y-100 opacity-100 translate-y-0"
              : "pointer-events-none scale-y-0 opacity-0 -translate-y-1"
          }`}
          style={{
            maxHeight: rightPanelTab === "places" ? "calc(100vh - 72px - 140px)" : 0,
            boxShadow: rightPanelTab === "places" ? "0 8px 24px rgba(30,20,10,0.12)" : "none"
          }}
        >
          <span className="pointer-events-none absolute left-0 top-0 h-full w-2 bg-amber-900/10" />
          <div className="space-y-2 py-2">
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  setQuickPlaceId(place.id);
                  setPanelMode("place");
                }}
                className="w-full rounded-md border border-amber-900/20 bg-white/90 px-2 py-2 text-left text-sm hover:bg-amber-50"
              >
                <div className="font-medium">{place.name || "Lieu sans nom"}</div>
                <div className="text-xs text-amber-900/60">{place.region || "Lieu de campagne"}</div>
              </button>
            ))}
            {places.length === 0 && (
              <p className="text-xs text-amber-900/60">Aucun lieu disponible.</p>
            )}
          </div>
        </div>
      </div>
      <>
        <div
          className="fixed top-[72px] left-0 right-0 bottom-0 z-40 bg-black/25 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none"
          style={{ pointerEvents: isQuickOpen ? "auto" : "none", opacity: isQuickOpen ? 1 : 0 }}
          onClick={() => {
            setPanelMode(null);
            setQuickNpcId(null);
            setQuickPlaceId(null);
          }}
          aria-hidden="true"
        />
        <aside
          className={`fixed inset-y-0 right-0 z-50 overflow-hidden bg-[#F2E7D4] border-l border-amber-900/20 shadow-2xl
        transform transition-transform duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none
        ${isQuickOpen ? "translate-x-0" : "translate-x-full"}`}
          aria-hidden={!isQuickOpen}
          style={{ pointerEvents: isQuickOpen ? "auto" : "none" }}
        >
          <div className={`h-full overflow-y-auto w-[90vw] sm:w-[360px] lg:w-[420px]`}>
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
                          }}
                          className="btn btn-subtle text-sm"
                          aria-label="Retour à la recherche"
                        >
                          ←
                        </button>
                      )}
                    </div>
                    <h3 className="text-center text-lg font-semibold">
                      {panelMode === "search"
                        ? "Recherche (session)"
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
                      placeholder="Rechercher une scène ou un PNJ..."
                      className="min-h-11 w-full rounded-md border border-amber-900/20 bg-white/80 px-3 py-2 text-base"
                    />
                    <div className="flex flex-wrap gap-2 text-xs">
                      {([
                        { id: "all", label: "Tout" },
                        { id: "scenes", label: "Scènes" },
                        { id: "npcs", label: "PNJ" },
                        { id: "places", label: "Lieux" }
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSearchScope(tab.id)}
                          className={`btn btn-subtle ${
                            searchScope === tab.id ? "btn-active" : "text-amber-900/70"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {searchScope === "places" && places.length === 0 && (
                      <p className="text-sm text-amber-950/70">Aucun lieu disponible dans la campagne.</p>
                    )}
                    {debouncedQuery.trim() === "" && (
                      <p className="text-sm text-amber-950/70">
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
                                  className="card card-compact w-full text-left text-sm hover:bg-amber-50"
                                >
                                  <p className="font-medium">{scene.title}</p>
                                  {scene.snippet && (
                                    <p className="text-xs text-amber-900/70">{scene.snippet}</p>
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
                                    setQuickNpcId(npc.id);
                                    setPanelMode("npc");
                                  }}
                                  className="card card-compact w-full text-left text-sm hover:bg-amber-50"
                                >
                                  <p className="font-medium">{npc.title}</p>
                                  {"subtitle" in npc && npc.subtitle && (
                                    <p className="text-xs text-amber-900/70">{npc.subtitle}</p>
                                  )}
                                  {npc.snippet && <p className="text-xs text-amber-900/70">{npc.snippet}</p>}
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
                                    setQuickPlaceId(place.id);
                                    setPanelMode("place");
                                  }}
                                  className="card card-compact w-full text-left text-sm hover:bg-amber-50"
                                >
                                  <p className="font-medium">{place.title}</p>
                                  {"subtitle" in place && place.subtitle && (
                                    <p className="text-xs text-amber-900/70">{place.subtitle}</p>
                                  )}
                                  {place.snippet && (
                                    <p className="text-xs text-amber-900/70">{place.snippet}</p>
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
                      searchResults.places.length === 0 && (
                        <p className="text-sm text-amber-950/70">Aucun résultat trouvé.</p>
                      )}
                  </div>
                </div>
              ) : panelMode === "npc" && quickNpc ? (
                <div className="live-quick-panel">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-amber-900/70">{quickNpc.role || "Aucun rôle"}</p>
                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        attitudeStyles[quickNpc.attitude] ?? attitudeStyles.neutral
                      }`}
                    >
                      {quickNpc.attitude}
                    </span>
                  </div>
                  {quickNpc.description && (
                    <p className="mt-3 text-sm text-amber-950/80">{quickNpc.description}</p>
                  )}
                  {quickNpc.notes && (
                    <p className="mt-2 text-sm text-amber-950/70">{quickNpc.notes}</p>
                  )}
                </div>
              ) : panelMode === "place" && quickPlace ? (
                <div className="live-quick-panel">
                  {quickPlace.region && (
                    <p className="text-xs text-amber-900/70">{quickPlace.region}</p>
                  )}
                  {quickPlace.description && (
                    <p className="mt-3 text-sm text-amber-950/80">{quickPlace.description}</p>
                  )}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                      Scènes (session courante)
                    </p>
                    {quickPlaceScenes.currentSession.length > 0 ? (
                      <ul className="space-y-2">
                        {quickPlaceScenes.currentSession.map(({ scene }) => (
                          <li key={scene.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectScene(scene.id)}
                              className="card card-compact w-full text-left text-sm hover:bg-amber-50"
                            >
                              <p className="font-medium">{scene.title || `Scène ${scene.order}`}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-amber-950/70">Aucune scène liée dans cette session.</p>
                    )}
                    {quickPlaceScenes.otherCount > 0 && (
                      <p className="text-xs text-amber-900/70">
                        Utilisé dans {quickPlaceScenes.otherCount} autre
                        {quickPlaceScenes.otherCount > 1 ? "s" : ""} scène
                        {quickPlaceScenes.otherCount > 1 ? "s" : ""} de la campagne.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </>
      </div>
    </section>
  );
}





