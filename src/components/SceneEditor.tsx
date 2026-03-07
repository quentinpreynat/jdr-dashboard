import { useEffect, useState } from "react";
import type {
  ChoiceIntent,
  Npc,
  Place,
  Scene,
  SceneChoiceTargetType,
} from "../models";
import { SceneEditorAccordion } from "./SceneEditorAccordion";

interface SceneEditorProps {
  scene: Scene;
  places: Place[];
  npcs: Npc[];
  highlight?: boolean;
  onDelete(): void;
  onUpdate(fields: Partial<Omit<Scene, "id">>): void;
  onSetNpcLink(npcId: string, linked: boolean): void;
  onAddChoice(choice: {
    label: string;
    targetType: SceneChoiceTargetType;
    targetId: string;
  }): void;
  onRemoveChoice(choiceId: string): void;
}

interface ChoiceDraft {
  label: string;
  targetType: SceneChoiceTargetType;
  targetId: string;
}

export function SceneEditor({
  scene,
  places,
  npcs,
  highlight = false,
  onDelete,
  onUpdate,
  onSetNpcLink,
  onAddChoice,
  onRemoveChoice,
}: SceneEditorProps) {
  const [openChoiceId, setOpenChoiceId] = useState<string | null>(null);

  const defaultDraftType: SceneChoiceTargetType =
    places.length > 0 ? "place" : "npc";
  const defaultTargetId =
    defaultDraftType === "place" ? (places[0]?.id ?? "") : (npcs[0]?.id ?? "");

  const [choiceDraft, setChoiceDraft] = useState<ChoiceDraft>({
    label: "",
    targetType: defaultDraftType,
    targetId: defaultTargetId,
  });

  const choices = scene.choices ?? [];
  const placeName = scene.placeId
    ? (places.find((place) => place.id === scene.placeId)?.name ?? "Lieu inconnu")
    : "Aucun lieu";
  const metaSummary = `${placeName} • ${scene.linkedNpcIds.length} PNJ • ${choices.length} Choix`;
  const textPreview = scene.text.trim()
    ? scene.text.trim()
    : "Aucun texte de narration pour le moment.";

  useEffect(() => {
    const targets = choiceDraft.targetType === "place" ? places : npcs;
    if (targets.length === 0) {
      if (choiceDraft.targetId !== "") {
        setChoiceDraft((prev) => ({ ...prev, targetId: "" }));
      }
      return;
    }
    const exists = targets.some((target) => target.id === choiceDraft.targetId);
    if (!exists) {
      setChoiceDraft((prev) => ({ ...prev, targetId: targets[0].id }));
    }
  }, [choiceDraft.targetId, choiceDraft.targetType, npcs, places]);

  useEffect(() => {
    if (openChoiceId && !choices.some((choice) => choice.id === openChoiceId)) {
      setOpenChoiceId(null);
    }
  }, [choices, openChoiceId]);

  return (
    <li
      id={`scene-${scene.id}`}
      className={`mb-4 rounded-[6px] border border-[#c9962a] bg-[#faf3e0] p-4 shadow-[2px_2px_8px_rgba(0,0,0,0.15)] transition ${
        highlight ? "ring-2 ring-stone-500/40" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-cinzel text-[1rem] font-bold text-[#2c1a08]">
            {scene.title?.trim() || "Scene sans titre"}
          </h4>
          <p className="mt-1 text-sm text-stone-600">{metaSummary}</p>
          <p className="font-garamond mt-2 line-clamp-2 text-[0.9rem] italic text-[#5c3d1a]">
            {textPreview}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-[4px] border border-[#6b0f0f] bg-[#8b1a1a] px-[0.8rem] py-[0.4rem] font-cinzel text-[0.75rem] text-[#f5e6c8] transition-colors hover:bg-[#a0341a]"
        >
          Supprimer
        </button>
      </div>

      <div className="space-y-2">
        <SceneEditorAccordion title="Identite de la scene">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-stone-800">Titre</span>
            <input
              value={scene.title}
              onChange={(event) => onUpdate({ title: event.target.value })}
              className="parchment-text min-h-11 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            />
          </label>
        </SceneEditorAccordion>

        <SceneEditorAccordion title="Narration">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-stone-800">Texte</span>
            <textarea
              rows={7}
              value={scene.text}
              onChange={(event) => onUpdate({ text: event.target.value })}
              className="parchment-text min-h-40 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            />
          </label>
        </SceneEditorAccordion>

        <SceneEditorAccordion title="Lieu associe">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-stone-800">Lieu</span>
            <select
              value={scene.placeId ?? ""}
              onChange={(event) =>
                onUpdate({
                  placeId: event.target.value ? event.target.value : undefined,
                })
              }
              className="parchment-text min-h-11 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            >
              <option value="">Aucun</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name || "Lieu sans nom"}
                  {place.region ? ` - ${place.region}` : ""}
                </option>
              ))}
            </select>
          </label>
        </SceneEditorAccordion>

        <SceneEditorAccordion
          title={`Personnages lies (${scene.linkedNpcIds.length})`}
        >
          <div className="space-y-2">
            {npcs.map((npc) => {
              const isLinked = scene.linkedNpcIds.includes(npc.id);
              return (
                <label
                  key={npc.id}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 bg-stone-100/80 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={isLinked}
                    onChange={(event) => onSetNpcLink(npc.id, event.target.checked)}
                    className="h-4 w-4 accent-stone-700"
                  />
                  <span className="font-medium text-stone-800">
                    {npc.name || "PNJ sans nom"}
                  </span>
                  <span className="text-stone-600">{npc.role || "Aucun role"}</span>
                </label>
              );
            })}
            {npcs.length === 0 && (
              <p className="text-sm text-stone-600">
                Aucun PNJ disponible pour le moment.
              </p>
            )}
          </div>
        </SceneEditorAccordion>

        <SceneEditorAccordion title={`Choix narratifs (${choices.length})`}>
          <div className="space-y-2">
            {choices.map((choice, choiceIndex) => {
              const isOpen = openChoiceId === choice.id;
              const choiceTargets = choice.targetType === "place" ? places : npcs;
              return (
                <article
                  key={choice.id}
                  className="overflow-hidden rounded-md border border-stone-300 bg-stone-100/70 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenChoiceId((prev) => (prev === choice.id ? null : choice.id))
                    }
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-stone-800 hover:bg-stone-300/40"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`text-xs transition-transform duration-200 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    >
                      &gt;
                    </span>
                    <span>{choice.label?.trim() || "Choix sans texte"}</span>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-70"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-2 border-t border-stone-300 px-3 py-3 text-sm">
                        <input
                          value={choice.label}
                          onChange={(event) =>
                            onUpdate({
                              choices: choices.map((entry) =>
                                entry.id === choice.id
                                  ? { ...entry, label: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                          className="min-h-11 w-full rounded-md border border-stone-300 bg-stone-100 px-2 py-1 text-stone-800"
                        />
                        <div className="grid gap-2 lg:grid-cols-[160px_1fr_auto]">
                          <select
                            value={choice.targetType}
                            onChange={(event) => {
                              const nextType =
                                event.target.value as SceneChoiceTargetType;
                              const nextTargetId =
                                nextType === "place"
                                  ? (places[0]?.id ?? "")
                                  : (npcs[0]?.id ?? "");
                              onUpdate({
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
                            className="min-h-11 rounded-md border border-stone-300 bg-stone-100 px-2 py-1 text-stone-800"
                          >
                            <option value="place">Lieu</option>
                            <option value="npc">PNJ</option>
                          </select>
                          <select
                            value={choice.targetId}
                            onChange={(event) =>
                              onUpdate({
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
                            className="min-h-11 rounded-md border border-stone-300 bg-stone-100 px-2 py-1 text-stone-800"
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
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (choiceIndex === 0) {
                                  return;
                                }
                                const nextChoices = [...choices];
                                [nextChoices[choiceIndex - 1], nextChoices[choiceIndex]] = [
                                  nextChoices[choiceIndex],
                                  nextChoices[choiceIndex - 1],
                                ];
                                onUpdate({ choices: nextChoices });
                              }}
                              className="btn btn-subtle px-2 text-xs"
                              disabled={choiceIndex === 0}
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (choiceIndex === choices.length - 1) {
                                  return;
                                }
                                const nextChoices = [...choices];
                                [nextChoices[choiceIndex + 1], nextChoices[choiceIndex]] = [
                                  nextChoices[choiceIndex],
                                  nextChoices[choiceIndex + 1],
                                ];
                                onUpdate({ choices: nextChoices });
                              }}
                              className="btn btn-subtle px-2 text-xs"
                              disabled={choiceIndex === choices.length - 1}
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const confirmed = window.confirm("Supprimer ce choix ?");
                                if (!confirmed) {
                                  return;
                                }
                                onRemoveChoice(choice.id);
                              }}
                              className="btn btn-subtle px-2 text-xs"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                            Intention (icône Live)
                          </span>
                          <select
                            value={choice.intent ?? ""}
                            onChange={(event) =>
                              onUpdate({
                                choices: choices.map((entry) =>
                                  entry.id === choice.id
                                    ? {
                                        ...entry,
                                        intent: event.target.value
                                          ? (event.target.value as ChoiceIntent)
                                          : undefined,
                                      }
                                    : entry,
                                ),
                              })
                            }
                            className="min-h-11 rounded-md border border-stone-300 bg-stone-100 px-2 py-1 text-stone-800"
                          >
                            <option value="">Auto (neutre)</option>
                            <option value="explore">Explorer</option>
                            <option value="search">Fouiller</option>
                            <option value="move">Se déplacer</option>
                            <option value="talk">Parler</option>
                            <option value="attack">Attaquer</option>
                            <option value="other">Autre</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {choices.length === 0 && (
              <p className="text-sm text-stone-600">Aucun choix pour le moment.</p>
            )}
          </div>

          <div className="mt-3 space-y-2 rounded-md border border-stone-300 bg-stone-100/80 p-3">
            <input
              value={choiceDraft.label}
              onChange={(event) =>
                setChoiceDraft((prev) => ({ ...prev, label: event.target.value }))
              }
              placeholder="Texte du choix..."
              className="parchment-text min-h-11 w-full rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            />
            <div className="grid gap-2 lg:grid-cols-[140px_1fr_auto]">
              <select
                value={choiceDraft.targetType}
                onChange={(event) => {
                  const nextType = event.target.value as SceneChoiceTargetType;
                  const nextTargetId =
                    nextType === "place" ? (places[0]?.id ?? "") : (npcs[0]?.id ?? "");
                  setChoiceDraft((prev) => ({
                    ...prev,
                    targetType: nextType,
                    targetId: nextTargetId,
                  }));
                }}
                className="parchment-text min-h-11 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-800"
              >
                <option value="place">Lieu</option>
                <option value="npc">PNJ</option>
              </select>
              <select
                value={choiceDraft.targetId}
                onChange={(event) =>
                  setChoiceDraft((prev) => ({ ...prev, targetId: event.target.value }))
                }
                className="parchment-text min-h-11 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-sm text-stone-800"
              >
                {(choiceDraft.targetType === "place" ? places : npcs).length > 0 ? (
                  (choiceDraft.targetType === "place" ? places : npcs).map((target) => (
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
                  if (!choiceDraft.label.trim() || !choiceDraft.targetId) {
                    return;
                  }
                  onAddChoice({
                    label: choiceDraft.label,
                    targetType: choiceDraft.targetType,
                    targetId: choiceDraft.targetId,
                  });
                  setChoiceDraft((prev) => ({ ...prev, label: "" }));
                }}
                className="btn btn-subtle"
              >
                Ajouter
              </button>
            </div>
          </div>
        </SceneEditorAccordion>
      </div>
    </li>
  );
}
