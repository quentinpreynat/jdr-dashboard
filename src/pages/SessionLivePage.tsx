import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

const attitudeStyles: Record<string, string> = {
  friendly: "badge badge-friendly",
  neutral: "badge badge-neutral",
  wary: "badge badge-wary",
  hostile: "badge badge-hostile"
};

type SearchScope = "all" | "scenes" | "npcs";
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
  const { data, addSceneLiveNote, removeSceneLiveNote, updateScene } = useAppData();
  const session = data.sessions.find((entry) => entry.id === sessionId);

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
  const [isFocusMode, setIsFocusMode] = useState(() => {
    try {
      return localStorage.getItem("tor-live-focus-enabled") === "true";
    } catch {
      return false;
    }
  });
  const [isDimMode] = useState(() => {
    try {
      return localStorage.getItem("tor-live-dim-enabled") === "true";
    } catch {
      return false;
    }
  });
  const [noteTargetSceneId, setNoteTargetSceneId] = useState<string | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [quickNpcId, setQuickNpcId] = useState<string | null>(null);
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
    try {
      localStorage.setItem("tor-live-focus-enabled", String(isFocusMode));
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSearchScope("all");
      setQuickNpcId(null);
      return;
    }
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => window.clearTimeout(timer);
  }, [isSearchOpen, searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen && !quickNpcId) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (quickNpcId) {
          setQuickNpcId(null);
        } else {
          setIsSearchOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSearchOpen, quickNpcId]);


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

  const searchResults = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed || !session) {
      return { scenes: [] as SearchResult[], npcs: [] as SearchResult[] };
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

    return { scenes: sceneResults, npcs: npcResults };
  }, [debouncedQuery, session, sessionNpcs]);

  const quickNpc = quickNpcId ? data.npcs.find((npc) => npc.id === quickNpcId) : null;

  function handleSelectScene(sceneId: string) {
    setSelectedSceneId(sceneId);
    setFlashSceneId(sceneId);
    setIsSearchOpen(false);
    window.setTimeout(() => setFlashSceneId(null), 800);
  }

  return (
    <section className={`session-live h-screen w-full space-y-6 overflow-x-hidden px-6 py-5 ${isDimMode ? "is-dim" : ""}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
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
            onClick={() => setIsFocusMode((prev) => !prev)}
            className="btn btn-subtle"
          >
            {isFocusMode ? "Exit Focus" : "Focus"}
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
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
        className={`live-layout mx-auto grid w-full max-w-[1200px] min-w-0 gap-4 ${
          isFocusMode ? "is-focus" : ""
        }`}
      >
        <div className="scene-list card card-muted min-w-0 space-y-3">
          <p className="text-sm font-semibold">Scènes</p>
          <div className="space-y-3">
            {orderedScenes.map((scene) => {
              const isSelected = scene.id === selectedSceneId;
              return (
                <div
                  key={scene.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSceneId(scene.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setSelectedSceneId(scene.id);
                    }
                  }}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-amber-900/60 bg-amber-50 text-amber-950 shadow-sm"
                      : "border-amber-900/20 bg-white/90 text-amber-950/80 hover:bg-amber-50"
                  } ${isSelected ? "is-selected" : ""} ${flashSceneId === scene.id ? "flash-ring" : ""}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{scene.title || `Scène ${scene.order}`}</span>
                    {(scene.liveNotes?.length ?? 0) > 0 && (
                      <span className="text-xs text-amber-900/60">📝 Notes : {scene.liveNotes?.length ?? 0}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateScene(sessionId, scene.id, { done: !scene.done });
                    }}
                    className={`badge px-3 text-xs ${
                      scene.done ? "badge-friendly" : "badge-neutral"
                    }`}
                  >
                    {scene.done ? "Terminée" : "En cours"}
                  </button>
                </div>
              );
            })}
            {orderedScenes.length === 0 && (
              <p className="card card-dashed card-compact text-sm text-amber-950/70">
                Aucune scène pour le moment.
              </p>
            )}
          </div>
        </div>

        <div className="scene-panel card card-muted flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
          <div className="fade-in flex min-h-0 flex-col" key={selectedScene?.id ?? "empty"}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70">Scène sélectionnée</p>
                <h4 className="text-lg font-semibold">{selectedSceneTitle}</h4>
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
              {isFocusMode && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasPrev) {
                        setSelectedSceneId(orderedScenes[selectedIndex - 1].id);
                      }
                    }}
                    disabled={!hasPrev}
                    className="focus-nav btn btn-subtle text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span aria-hidden="true" className="text-base">
                      ‹
                    </span>
                    <span>Précédente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasNext) {
                        setSelectedSceneId(orderedScenes[selectedIndex + 1].id);
                      }
                    }}
                    disabled={!hasNext}
                    className="focus-nav btn btn-subtle text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>Suivante</span>
                    <span aria-hidden="true" className="text-base">
                      ›
                    </span>
                  </button>
                </div>
              )}
              <section className="live-card space-y-2 p-4 sm:p-5">
                <p className="live-label">Texte de scène</p>
                <h5 className="text-base font-semibold">{selectedSceneTitle}</h5>
                <div className="parchment-text text-sm live-muted">
                  {selectedScene?.text || "Aucun texte pour le moment."}
                </div>
              </section>

              <section className="live-card space-y-2 p-4 sm:p-5">
                <p className="live-label">Personnages</p>
                <div className="space-y-2">
                  {linkedNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      className="live-item card-compact flex min-h-11 items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{npc.name || "PNJ sans nom"}</p>
                        <p className="text-xs live-muted">{npc.role || "Aucun rôle"}</p>
                      </div>
                      <span className={attitudeStyles[npc.attitude] ?? attitudeStyles.neutral}>
                        {npc.attitude}
                      </span>
                    </div>
                  ))}
                  {linkedNpcs.length === 0 && (
                    <p className="card card-dashed card-compact text-sm live-muted">
                      Aucun personnage lié à cette scène.
                    </p>
                  )}
                </div>
              </section>

              <section className="live-card flex min-h-[280px] flex-col p-4 sm:p-5">
                <div className="flex flex-shrink-0 items-center justify-between">
                  <p className="live-label">Notes en direct</p>
                </div>
                <div className="mt-3 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
                  {selectedScene?.liveNotes?.map((note) => (
                    <div
                      key={note.id}
                      className="live-item card-compact flex min-h-11 items-start justify-between gap-3 text-sm"
                    >
                      {(() => {
                        const sourceScene = orderedScenes.find((scene) => scene.id === note.createdFromSceneId);
                        const sourceLabel = sourceScene
                          ? sourceScene.title?.trim() || `Scène ${sourceScene.order}`
                          : note.createdFromSceneId
                            ? "(scène supprimée)"
                            : selectedSceneTitle;
                        const labelText = sourceLabel === selectedSceneTitle ? `Depuis: ${selectedSceneTitle}` : `Depuis: ${sourceLabel}`;
                        return (
                          <p className="text-xs live-muted">
                            {new Date(note.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} —{" "}
                            <span className="font-medium">{labelText}</span> — {note.text}
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
                    <p className="card card-dashed card-compact text-sm live-muted">
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
      {isSearchOpen && (
        <div className="live-search-overlay">
          <button
            type="button"
            className="live-search-backdrop"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Fermer la recherche"
          />
          <div className={`live-search-panel ${isDimMode ? "is-dim" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Recherche (session)</h3>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="btn btn-subtle text-sm"
              >
                Fermer
              </button>
            </div>
            <div className="mt-3 space-y-3">
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
                  { id: "npcs", label: "PNJ" }
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

            <div className="mt-4 space-y-4">
              {debouncedQuery.trim() === "" && (
                <p className="text-sm text-amber-950/70">Saisissez une recherche pour afficher les résultats.</p>
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
                            {scene.snippet && <p className="text-xs text-amber-900/70">{scene.snippet}</p>}
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
                            onClick={() => setQuickNpcId(npc.id)}
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
                searchResults.scenes.length === 0 &&
                searchResults.npcs.length === 0 && (
                  <p className="text-sm text-amber-950/70">Aucun résultat trouvé.</p>
                )}
            </div>
          </div>

          {quickNpc && (
            <div className="live-search-panel live-quick-panel">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{quickNpc.name || "PNJ sans nom"}</p>
                  <p className="text-xs text-amber-900/70">{quickNpc.role || "Aucun rôle"}</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-xs ${
                    attitudeStyles[quickNpc.attitude] ?? attitudeStyles.neutral
                  }`}
                >
                  {quickNpc.attitude}
                </span>
              </div>
              {quickNpc.description && <p className="mt-3 text-sm text-amber-950/80">{quickNpc.description}</p>}
              {quickNpc.notes && <p className="mt-2 text-sm text-amber-950/70">{quickNpc.notes}</p>}
              <button
                type="button"
                onClick={() => setQuickNpcId(null)}
                className="btn btn-subtle mt-4"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}





