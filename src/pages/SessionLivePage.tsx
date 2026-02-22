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
    addSceneChoice,
    removeSceneChoice,
    updateScene,
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
  const [choiceLabel, setChoiceLabel] = useState("");
  const [choiceTargetType, setChoiceTargetType] = useState<"place" | "npc" | "none">("none");
  const [choiceTargetId, setChoiceTargetId] = useState<string>("");
  const [choiceGotoSceneId, setChoiceGotoSceneId] = useState<string>("");
  const [rightPanelTab, setRightPanelTab] = useState<"scenes" | "npcs" | "places" | null>(
    null
  );
  const RIGHT_PANEL_COLLAPSED_PX = 70;
  const RIGHT_PANEL_EXPANDED_PX = 140;
  const isRightPanelExpanded = rightPanelTab !== null;
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
  const choiceTargets = useMemo(
    () => (choiceTargetType === "place" ? places : sessionNpcs.list),
    [choiceTargetType, places, sessionNpcs.list]
  );

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
    if (choiceTargetType === "none" || choiceTargetId) {
      return;
    }
    const first = choiceTargets[0]?.id ?? "";
    if (first) {
      setChoiceTargetId(first);
    }
  }, [choiceTargetId, choiceTargets]);

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
            paddingRight: isRightPanelExpanded ? RIGHT_PANEL_EXPANDED_PX : RIGHT_PANEL_COLLAPSED_PX
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
              {selectedScene && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateScene(sessionId, selectedScene.id, { done: !selectedScene.done })}
                    className="btn btn-subtle"
                  >
                    {selectedScene.done ? "Marquer en cours" : "Marquer terminée"}
                  </button>
                </div>
              )}
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
                <div className="mt-2 space-y-2">
                  {(selectedScene?.choices ?? []).map((choice) => (
                    <div key={choice.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-md border border-amber-900/10 bg-white/60 px-3 py-2 text-left text-sm hover:bg-amber-50/60"
                        onClick={() => {
                          if (choice.targetType === "place" && choice.targetId) {
                            setQuickPlaceId(choice.targetId);
                            setPanelMode("place");
                          } else if (choice.targetType === "npc" && choice.targetId) {
                            setQuickNpcId(choice.targetId);
                            setPanelMode("npc");
                          }
                          if (choice.gotoSceneId) {
                            setSelectedSceneId(choice.gotoSceneId);
                            setFlashSceneId(choice.gotoSceneId);
                            window.setTimeout(() => setFlashSceneId(null), 800);
                          }
                        }}
                      >
                        <span className="mr-2" aria-hidden="true">
                          {choice.targetType === "place"
                            ? "📍"
                            : choice.targetType === "npc"
                              ? "🎭"
                              : "➜"}
                        </span>
                        {choice.label}
                        {choice.gotoSceneId && <span className="ml-2 text-xs text-amber-900/60">➜</span>}
                      </button>

                      <button
                        type="button"
                        className="btn btn-subtle text-xs"
                        onClick={() => {
                          if (!sessionId || !selectedScene) {
                            return;
                          }
                          const ok = window.confirm("Supprimer ce choix ?");
                          if (!ok) {
                            return;
                          }
                          removeSceneChoice(sessionId, selectedScene.id, choice.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {(selectedScene?.choices?.length ?? 0) === 0 && (
                    <p className="rounded-md border border-amber-900/10 bg-white/50 px-3 py-2 text-sm live-muted">
                      Aucun choix défini.
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <input
                    value={choiceLabel}
                    onChange={(event) => setChoiceLabel(event.target.value)}
                    placeholder="Ex : Aller à la taverne / Parler au forgeron..."
                    className="live-input min-h-10 w-full rounded-md px-3 py-2 text-sm"
                  />

                  <div className="flex gap-2">
                    <select
                      value={choiceTargetType}
                      onChange={(event) => {
                        const nextType = event.target.value as "place" | "npc";
                        setChoiceTargetType(nextType);
                        setChoiceTargetId("");
                      }}
                      className="live-input min-h-10 w-28 rounded-md px-2 py-2 text-sm"
                    >
                      <option value="none">Aucun</option>
                      <option value="place">Lieu</option>
                      <option value="npc">PNJ</option>
                    </select>

                    <select
                      value={choiceTargetId}
                      onChange={(event) => setChoiceTargetId(event.target.value)}
                      className="live-input min-h-10 flex-1 rounded-md px-2 py-2 text-sm"
                    >
                      {choiceTargetType === "none" && <option value="">Aucune cible</option>}
                      {choiceTargetType === "place" &&
                        (places.length > 0 ? (
                          places.map((place) => (
                            <option key={place.id} value={place.id}>
                              {place.name || "Lieu sans nom"}
                            </option>
                          ))
                        ) : (
                          <option value="">Aucun lieu</option>
                        ))}
                      {choiceTargetType === "npc" &&
                        (sessionNpcs.list.length > 0 ? (
                          sessionNpcs.list.map((npc) => (
                            <option key={npc.id} value={npc.id}>
                              {npc.name || "PNJ sans nom"}
                            </option>
                          ))
                        ) : (
                          <option value="">Aucun PNJ</option>
                        ))}
                    </select>

                    <select
                      value={choiceGotoSceneId}
                      onChange={(event) => setChoiceGotoSceneId(event.target.value)}
                      className="live-input min-h-10 flex-1 rounded-md px-2 py-2 text-sm"
                    >
                      <option value="">(Aucune)</option>
                      {orderedScenes.map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.title?.trim() || `Scène ${scene.order}`}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={choiceTargetType !== "none" && !choiceTargetId}
                      onClick={() => {
                        if (!sessionId || !selectedScene) {
                          return;
                        }
                        addSceneChoice(sessionId, selectedScene.id, {
                          label: choiceLabel,
                          targetType: choiceTargetType,
                          targetId: choiceTargetId || undefined,
                          gotoSceneId: choiceGotoSceneId || undefined
                        });
                        setChoiceLabel("");
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
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
          width: isRightPanelExpanded ? RIGHT_PANEL_EXPANDED_PX : RIGHT_PANEL_COLLAPSED_PX,
          transition: "width 240ms ease"
        }}
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setRightPanelTab((prev) => (prev === "scenes" ? null : "scenes"))}
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
            onClick={() => setRightPanelTab((prev) => (prev === "npcs" ? null : "npcs"))}
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
        {rightPanelTab === "scenes" && (
          <div
            className="mt-3 space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 72px - 140px)" }}
          >
            {orderedScenes.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneId(scene.id)}
                className={`w-full rounded-md border px-2 py-2 text-left text-sm ${
                  scene.id === selectedSceneId
                    ? "border-amber-900/60 bg-amber-50"
                    : "border-amber-900/20 bg-white/90 hover:bg-amber-50"
                }`}
              >
                <div className="font-medium">{scene.title || `Scène ${scene.order}`}</div>
                {(scene.liveNotes?.length ?? 0) > 0 && (
                  <div className="mt-1 text-xs text-amber-900/60">
                    📝 Notes : {scene.liveNotes.length}
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
        )}
        {rightPanelTab === "npcs" && (
          <div
            className="mt-3 space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 72px - 140px)" }}
          >
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
        )}
        {rightPanelTab === "places" && (
          <div
            className="mt-3 space-y-2 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 72px - 140px)" }}
          >
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
        )}
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





