import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppData } from "../state/AppDataContext";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const {
    data,
    updateSession,
    addScene,
    updateScene,
    deleteScene,
    moveScene,
    setSceneNpcLink,
    addSceneChoice,
    removeSceneChoice,
  } = useAppData();
  const session = data.sessions.find((entry) => entry.id === sessionId);
  const [highlightSceneId, setHighlightSceneId] = useState<string | null>(null);
  const [choiceDrafts, setChoiceDrafts] = useState<
    Record<
      string,
      { label: string; targetType: "place" | "npc"; targetId: string }
    >
  >({});
  const places = data.campaign.places ?? [];

  useEffect(() => {
    if (!session || !sessionId) {
      return;
    }
    const params = new URLSearchParams(location.search);
    const sceneId = params.get("scene");
    if (!sceneId) {
      return;
    }
    setHighlightSceneId(sceneId);
    const target = document.getElementById(`scene-${sceneId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => setHighlightSceneId(null), 1500);
    }
  }, [location.search, session, sessionId]);
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
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Détails de la session</h2>
        <div className="flex flex-wrap gap-2">
          <Link to={`/session/${sessionId}/live`} className="btn btn-subtle">
            Open Session Live
          </Link>
          <button
            type="button"
            onClick={() => addScene(sessionId)}
            className="btn btn-primary"
          >
            Ajouter une scène
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Titre</span>
          <input
            value={session.title}
            onChange={(event) =>
              updateSession(sessionId, { title: event.target.value })
            }
            className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Objectif</span>
          <input
            value={session.objective}
            onChange={(event) =>
              updateSession(sessionId, { objective: event.target.value })
            }
            className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Notes du MJ</span>
        <textarea
          rows={5}
          value={session.notes}
          onChange={(event) =>
            updateSession(sessionId, { notes: event.target.value })
          }
          className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <div className="card card-compact space-y-3">
        <h3 className="text-lg font-semibold">Scènes</h3>
        <ul className="space-y-3">
          {[...session.scenes]
            .sort((a, b) => a.order - b.order)
            .map((scene, index, orderedScenes) => {
              const choices = scene.choices ?? [];
              const defaultDraftType = places.length > 0 ? "place" : "npc";
              const defaultTargetId =
                defaultDraftType === "place"
                  ? (places[0]?.id ?? "")
                  : (data.npcs[0]?.id ?? "");
              const draft = choiceDrafts[scene.id] ?? {
                label: "",
                targetType: defaultDraftType,
                targetId: defaultTargetId,
              };
              const draftTargets =
                draft.targetType === "place" ? places : data.npcs;
              return (
                <li
                  id={`scene-${scene.id}`}
                  key={scene.id}
                  className={`card card-compact ${
                    highlightSceneId === scene.id
                      ? "ring-2 ring-amber-400/60"
                      : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-amber-950/70">
                      Scène {scene.order}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveScene(sessionId, scene.id, "up")}
                        disabled={index === 0}
                        className="btn btn-subtle px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Monter
                      </button>
                      <button
                        type="button"
                        onClick={() => moveScene(sessionId, scene.id, "down")}
                        disabled={index === orderedScenes.length - 1}
                        className="btn btn-subtle px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Descendre
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScene(sessionId, scene.id)}
                        className="btn btn-danger"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <label className="mb-2 flex flex-col gap-1">
                    <span className="text-sm font-medium">Titre</span>
                    <input
                      value={scene.title}
                      onChange={(event) =>
                        updateScene(sessionId, scene.id, {
                          title: event.target.value,
                        })
                      }
                      className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
                    />
                  </label>
                  <label className="mb-2 flex flex-col gap-1">
                    <span className="text-sm font-medium">Lieu</span>
                    <select
                      value={scene.placeId ?? ""}
                      onChange={(event) =>
                        updateScene(sessionId, scene.id, {
                          placeId: event.target.value
                            ? event.target.value
                            : undefined,
                        })
                      }
                      className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
                    >
                      <option value="">Aucun</option>
                      {places.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name || "Lieu sans nom"}
                          {place.region ? ` — ${place.region}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Texte</span>
                    <textarea
                      rows={4}
                      value={scene.text}
                      onChange={(event) =>
                        updateScene(sessionId, scene.id, {
                          text: event.target.value,
                        })
                      }
                      className="parchment-text rounded-md border border-amber-900/20 px-3 py-2"
                    />
                  </label>
                  <div className="card card-compact mt-3">
                    <p className="text-xs font-medium text-amber-900">Choix</p>
                    <div className="mt-2 space-y-2">
                      {choices.map((choice, choiceIndex) => {
                        const choiceTargets =
                          choice.targetType === "place" ? places : data.npcs;
                        return (
                          <div
                            key={choice.id}
                            className="flex flex-wrap items-center gap-2 rounded-md border border-amber-900/10 bg-white/60 px-3 py-2 text-sm"
                          >
                            <input
                              value={choice.label}
                              onChange={(event) =>
                                updateScene(sessionId, scene.id, {
                                  choices: choices.map((entry) =>
                                    entry.id === choice.id
                                      ? { ...entry, label: event.target.value }
                                      : entry,
                                  ),
                                })
                              }
                              className="min-h-9 flex-1 rounded-md border border-amber-900/10 bg-white/80 px-2 py-1"
                            />
                            <select
                              value={choice.targetType}
                              onChange={(event) => {
                                const nextType = event.target.value as
                                  | "place"
                                  | "npc";
                                const nextTargetId =
                                  nextType === "place"
                                    ? (places[0]?.id ?? "")
                                    : (data.npcs[0]?.id ?? "");
                                updateScene(sessionId, scene.id, {
                                  choices: choices.map((entry) =>
                                    entry.id === choice.id
                                      ? {
                                          ...entry,
                                          targetType: nextType,
                                          targetId: nextTargetId,
                                        }
                                      : entry,
                                  ),
                                });
                              }}
                              className="min-h-9 rounded-md border border-amber-900/10 bg-white/80 px-2 py-1 text-sm"
                            >
                              <option value="place">Lieu</option>
                              <option value="npc">PNJ</option>
                            </select>
                            <select
                              value={choice.targetId}
                              onChange={(event) =>
                                updateScene(sessionId, scene.id, {
                                  choices: choices.map((entry) =>
                                    entry.id === choice.id
                                      ? {
                                          ...entry,
                                          targetId: event.target.value,
                                        }
                                      : entry,
                                  ),
                                })
                              }
                              className="min-h-9 rounded-md border border-amber-900/10 bg-white/80 px-2 py-1 text-sm"
                            >
                              {choiceTargets.length > 0 ? (
                                choiceTargets.map((target) => (
                                  <option key={target.id} value={target.id}>
                                    {target.name || "Sans nom"}
                                  </option>
                                ))
                              ) : (
                                <option value="">Aucun</option>
                              )}
                            </select>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (choiceIndex === 0) {
                                    return;
                                  }
                                  const nextChoices = [...choices];
                                  [
                                    nextChoices[choiceIndex - 1],
                                    nextChoices[choiceIndex],
                                  ] = [
                                    nextChoices[choiceIndex],
                                    nextChoices[choiceIndex - 1],
                                  ];
                                  updateScene(sessionId, scene.id, {
                                    choices: nextChoices,
                                  });
                                }}
                                className="btn btn-subtle px-2 text-xs"
                                disabled={choiceIndex === 0}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (choiceIndex === choices.length - 1) {
                                    return;
                                  }
                                  const nextChoices = [...choices];
                                  [
                                    nextChoices[choiceIndex + 1],
                                    nextChoices[choiceIndex],
                                  ] = [
                                    nextChoices[choiceIndex],
                                    nextChoices[choiceIndex + 1],
                                  ];
                                  updateScene(sessionId, scene.id, {
                                    choices: nextChoices,
                                  });
                                }}
                                className="btn btn-subtle px-2 text-xs"
                                disabled={choiceIndex === choices.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    "Supprimer ce choix ?",
                                  );
                                  if (!confirmed) {
                                    return;
                                  }
                                  removeSceneChoice(
                                    sessionId,
                                    scene.id,
                                    choice.id,
                                  );
                                }}
                                className="btn btn-subtle px-2 text-xs"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {choices.length === 0 && (
                        <p className="text-sm text-amber-950/70">
                          Aucun choix pour le moment.
                        </p>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <input
                        value={draft.label}
                        onChange={(event) =>
                          setChoiceDrafts((prev) => ({
                            ...prev,
                            [scene.id]: { ...draft, label: event.target.value },
                          }))
                        }
                        placeholder="Texte du choix..."
                        className="parchment-text w-full rounded-md border border-amber-900/20 px-3 py-2"
                      />
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={draft.targetType}
                          onChange={(event) => {
                            const nextType = event.target.value as
                              | "place"
                              | "npc";
                            const nextTargetId =
                              nextType === "place"
                                ? (places[0]?.id ?? "")
                                : (data.npcs[0]?.id ?? "");
                            setChoiceDrafts((prev) => ({
                              ...prev,
                              [scene.id]: {
                                ...draft,
                                targetType: nextType,
                                targetId: nextTargetId,
                              },
                            }));
                          }}
                          className="parchment-text rounded-md border border-amber-900/20 px-3 py-2 text-sm"
                        >
                          <option value="place">Lieu</option>
                          <option value="npc">PNJ</option>
                        </select>
                        <select
                          value={draft.targetId}
                          onChange={(event) =>
                            setChoiceDrafts((prev) => ({
                              ...prev,
                              [scene.id]: {
                                ...draft,
                                targetId: event.target.value,
                              },
                            }))
                          }
                          className="parchment-text flex-1 rounded-md border border-amber-900/20 px-3 py-2 text-sm"
                        >
                          {draftTargets.length > 0 ? (
                            draftTargets.map((target) => (
                              <option key={target.id} value={target.id}>
                                {target.name || "Sans nom"}
                              </option>
                            ))
                          ) : (
                            <option value="">Aucun</option>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!draft.label.trim() || !draft.targetId) {
                              return;
                            }
                            addSceneChoice(sessionId, scene.id, {
                              label: draft.label,
                              targetType: draft.targetType,
                              targetId: draft.targetId,
                            });
                            setChoiceDrafts((prev) => ({
                              ...prev,
                              [scene.id]: { ...draft, label: "" },
                            }));
                          }}
                          className="btn btn-subtle"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card card-compact mt-3">
                    <p className="text-xs font-medium text-amber-900">
                      PNJ liés
                    </p>
                    <div className="mt-2 space-y-2">
                      {data.npcs.map((npc) => {
                        const isLinked = scene.linkedNpcIds.includes(npc.id);
                        return (
                          <label
                            key={npc.id}
                            className="card card-compact flex min-h-11 items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={isLinked}
                              onChange={(event) =>
                                setSceneNpcLink(
                                  session.id,
                                  scene.id,
                                  npc.id,
                                  event.target.checked,
                                )
                              }
                              className="h-4 w-4 accent-amber-900"
                            />
                            <span className="font-medium">
                              {npc.name || "PNJ sans nom"}
                            </span>
                            <span className="text-amber-900/70">
                              {npc.role || "Aucun rôle"}
                            </span>
                          </label>
                        );
                      })}
                      {data.npcs.length === 0 && (
                        <p className="text-sm text-amber-950/70">
                          Aucun PNJ disponible pour le moment.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          {session.scenes.length === 0 && (
            <li className="card card-dashed card-compact text-sm text-amber-950/70">
              Aucune scène pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
