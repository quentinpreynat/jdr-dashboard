import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cloneDemoData } from "../lib/demoData";
import { addSnapshot, db, pruneSnapshots } from "../lib/db";
import { createId } from "../lib/id";
import { migrateIfNeeded } from "../lib/migrateFromLocalStorage";
import { createLocalStorageStore } from "../lib/storage";
import type {
  AppData,
  Campaign,
  Npc,
  Place,
  PlayerCharacter,
  Scene,
  Session,
} from "../models";

interface AppDataContextValue {
  data: AppData;
  lastSavedAt: string | null;
  updateCampaign(fields: Partial<Omit<Campaign, "id">>): void;
  addPlace(campaignId: string, place: Omit<Place, "id">): string;
  updatePlace(
    campaignId: string,
    placeId: string,
    fields: Partial<Omit<Place, "id">>,
  ): void;
  removePlace(campaignId: string, placeId: string): void;
  findCampaignBySessionId(sessionId: string): Campaign | null;
  moveSessionTimeline(sessionId: string, direction: "up" | "down"): void;
  createSession(): string;
  deleteSession(sessionId: string): void;
  updateSession(
    sessionId: string,
    fields: Partial<Omit<Session, "id" | "scenes">>,
  ): void;
  addScene(sessionId: string): void;
  updateScene(
    sessionId: string,
    sceneId: string,
    fields: Partial<Omit<Scene, "id" | "order">>,
  ): void;
  addSceneLiveNote(
    sessionId: string,
    targetSceneId: string,
    text: string,
    createdFromSceneId?: string,
  ): void;
  removeSceneLiveNote(sessionId: string, sceneId: string, noteId: string): void;
  addSceneChoice(
    sessionId: string,
    sceneId: string,
    choice: { label: string; targetType: "place" | "npc"; targetId: string },
  ): void;
  removeSceneChoice(sessionId: string, sceneId: string, choiceId: string): void;
  deleteScene(sessionId: string, sceneId: string): void;
  moveScene(sessionId: string, sceneId: string, direction: "up" | "down"): void;
  setSceneNpcLink(
    sessionId: string,
    sceneId: string,
    npcId: string,
    linked: boolean,
  ): void;
  createNpc(): string;
  deleteNpc(npcId: string): void;
  updateNpc(npcId: string, fields: Partial<Omit<Npc, "id">>): void;
  createPlayerCharacter(): string;
  deletePlayerCharacter(pcId: string): void;
  updatePlayerCharacter(
    pcId: string,
    fields: Partial<Omit<PlayerCharacter, "id">>,
  ): void;
  resetDemoData(): void;
  replaceData(raw: unknown): { ok: boolean; error?: string };
}

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined,
);
const store = createLocalStorageStore();

function moveToSequentialOrder<T extends { order: number }>(items: T[]): T[] {
  // Keep order values dense after deletions so list numbering stays simple.
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function nowIso(): string {
  return new Date().toISOString();
}

function nowMs(): number {
  return Date.now();
}

function ensureTimestamp(value: string | undefined, fallback: string): string {
  return value ?? fallback;
}

function ensureCampaignTimestamps(campaign: Campaign): Campaign {
  const fallback = nowIso();
  return {
    ...campaign,
    places: campaign.places ?? [],
    createdAt: ensureTimestamp(campaign.createdAt, fallback),
    updatedAt: ensureTimestamp(campaign.updatedAt, fallback),
  };
}

function ensureSessionTimestamps(session: Session): Session {
  const fallback = nowIso();
  return {
    ...session,
    scenes: session.scenes.map((scene) => ({
      ...scene,
      linkedNpcIds: scene.linkedNpcIds ?? [],
      done: scene.done ?? false,
      choices: scene.choices ?? [],
      liveNotes: (scene.liveNotes ?? []).map((note) => ({
        ...note,
        createdAt:
          typeof note.createdAt === "number"
            ? note.createdAt
            : Date.parse(String(note.createdAt)),
      })),
    })),
    inTimeline: session.inTimeline ?? true,
    timelineOrder: session.timelineOrder ?? 0,
    createdAt: ensureTimestamp(session.createdAt, fallback),
    updatedAt: ensureTimestamp(session.updatedAt, fallback),
  };
}

function ensureNpcTimestamps(npc: Npc): Npc {
  const fallback = nowIso();
  return {
    ...npc,
    attitude: npc.attitude ?? "neutral",
    createdAt: ensureTimestamp(npc.createdAt, fallback),
    updatedAt: ensureTimestamp(npc.updatedAt, fallback),
  };
}

function ensurePlayerCharacter(pc: PlayerCharacter): PlayerCharacter {
  const fallback = nowIso();
  return {
    ...pc,
    role: pc.role ?? "",
    hpCurrent: typeof pc.hpCurrent === "number" ? pc.hpCurrent : 0,
    hpMax: typeof pc.hpMax === "number" ? pc.hpMax : 0,
    stats: pc.stats ?? { for: 0, dex: 0, int: 0, con: 0 },
    conditions: pc.conditions ?? [],
    createdAt: ensureTimestamp(pc.createdAt, fallback),
    updatedAt: ensureTimestamp(pc.updatedAt, fallback),
  };
}

function ensureAppData(data: AppData): AppData {
  const { timelineItems: _legacyTimelineItems, ...campaign } =
    data.campaign as Campaign & {
      timelineItems?: unknown;
    };
  const normalized = {
    ...data,
    campaign: ensureCampaignTimestamps(campaign),
    sessions: data.sessions.map(ensureSessionTimestamps),
    npcs: data.npcs.map(ensureNpcTimestamps),
    pcs: (data.pcs ?? []).map(ensurePlayerCharacter),
  };
  const withTimeline = {
    ...normalized,
    sessions: normalized.sessions.map((session, index) => ({
      ...session,
      timelineOrder:
        session.timelineOrder && session.timelineOrder > 0
          ? session.timelineOrder
          : index + 1,
    })),
  };
  return withTimeline;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function isLiveNote(
  value: unknown,
): value is {
  id: string;
  text: string;
  createdAt: number;
  createdFromSceneId?: string;
} {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "number" &&
    (value.createdFromSceneId === undefined ||
      typeof value.createdFromSceneId === "string")
  );
}

function isSceneChoice(
  value: unknown,
): value is {
  id: string;
  label: string;
  targetType: "place" | "npc";
  targetId: string;
} {
  if (!isRecord(value)) {
    return false;
  }
  const targetType = value.targetType;
  const validTargetType = targetType === "place" || targetType === "npc";
  const targetId = value.targetId;
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    validTargetType &&
    typeof targetId === "string"
  );
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) {
    return false;
  }
  const linkedNpcIds = value.linkedNpcIds;
  const liveNotes = value.liveNotes;
  const placeId = value.placeId;
  const choices = value.choices;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.text === "string" &&
    typeof value.order === "number" &&
    (linkedNpcIds === undefined || isStringArray(linkedNpcIds)) &&
    (placeId === undefined || typeof placeId === "string") &&
    (value.done === undefined || typeof value.done === "boolean") &&
    (liveNotes === undefined ||
      (Array.isArray(liveNotes) && liveNotes.every(isLiveNote))) &&
    (choices === undefined ||
      (Array.isArray(choices) && choices.every(isSceneChoice)))
  );
}

function isSession(value: unknown): value is Session {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.objective === "string" &&
    typeof value.notes === "string" &&
    Array.isArray(value.scenes) &&
    value.scenes.every(isScene) &&
    typeof value.inTimeline === "boolean" &&
    typeof value.timelineOrder === "number" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isNpc(value: unknown): value is Npc {
  if (!isRecord(value)) {
    return false;
  }
  const attitude = value.attitude;
  const validAttitude =
    attitude === "friendly" ||
    attitude === "neutral" ||
    attitude === "wary" ||
    attitude === "hostile";
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.locationText === "string" &&
    typeof value.description === "string" &&
    typeof value.notes === "string" &&
    validAttitude &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isPlayerStats(
  value: unknown,
): value is { for: number; dex: number; int: number; con: number } {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.for === "number" &&
    typeof value.dex === "number" &&
    typeof value.int === "number" &&
    typeof value.con === "number"
  );
}

function isPlayerCharacter(value: unknown): value is PlayerCharacter {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.hpCurrent === "number" &&
    typeof value.hpMax === "number" &&
    isPlayerStats(value.stats) &&
    Array.isArray(value.conditions) &&
    value.conditions.every((entry) => typeof entry === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isPlace(value: unknown): value is Place {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.region === undefined || typeof value.region === "string") &&
    (value.description === undefined || typeof value.description === "string")
  );
}

function isCampaign(value: unknown): value is Campaign {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.tone === "string" &&
    (value.places === undefined ||
      (Array.isArray(value.places) && value.places.every(isPlace)))
  );
}

function isAppData(value: unknown): value is AppData {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isCampaign(value.campaign) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isSession) &&
    Array.isArray(value.npcs) &&
    value.npcs.every(isNpc) &&
    (value.pcs === undefined ||
      (Array.isArray(value.pcs) && value.pcs.every(isPlayerCharacter)))
  );
}

function swapOrderedItem<T extends { order: number; id: string }>(
  items: T[],
  itemId: string,
  direction: "up" | "down",
): T[] {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return items;
  }

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= ordered.length) {
    return items;
  }

  const swapped = [...ordered];
  const temp = swapped[index];
  swapped[index] = swapped[nextIndex];
  swapped[nextIndex] = temp;
  return moveToSequentialOrder(swapped);
}

function initialData(): AppData {
  const persisted = store.load();
  const seed = persisted ?? cloneDemoData();
  return ensureAppData(seed);
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    void migrateIfNeeded();
    void db.open().catch((error) => {
      console.error("IndexedDB: failed to open database", error);
    });
  }, []);

  useEffect(() => {
    store.save(data);
    setLastSavedAt(nowIso());
  }, [data]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void addSnapshot(data)
        .then(() => pruneSnapshots(20))
        .catch((error) => {
          console.error("Snapshot: failed to persist to IndexedDB", error);
        });
    }, 500);

    return () => {
      window.clearTimeout(handle);
    };
  }, [data]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      lastSavedAt,
      updateCampaign(fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: { ...prev.campaign, ...fields, updatedAt: timestamp },
        }));
      },
      findCampaignBySessionId(sessionId) {
        if (!sessionId) {
          return null;
        }
        const hasSession = data.sessions.some(
          (session) => session.id === sessionId,
        );
        return hasSession ? data.campaign : null;
      },
      addPlace(campaignId, place) {
        if (campaignId !== data.campaign.id) {
          return "";
        }
        const timestamp = nowIso();
        const placeId = createId("place");
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            places: [
              ...(prev.campaign.places ?? []),
              {
                id: placeId,
                name: place.name,
                region: place.region ?? "",
                description: place.description ?? "",
              },
            ],
            updatedAt: timestamp,
          },
        }));
        return placeId;
      },
      updatePlace(campaignId, placeId, fields) {
        if (campaignId !== data.campaign.id) {
          return;
        }
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            places: (prev.campaign.places ?? []).map((place) =>
              place.id === placeId ? { ...place, ...fields } : place,
            ),
            updatedAt: timestamp,
          },
        }));
      },
      removePlace(campaignId, placeId) {
        if (campaignId !== data.campaign.id) {
          return;
        }
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            places: (prev.campaign.places ?? []).filter(
              (place) => place.id !== placeId,
            ),
            updatedAt: timestamp,
          },
          sessions: prev.sessions.map((session) => {
            const hasSceneLink = session.scenes.some(
              (scene) => scene.placeId === placeId,
            );
            if (!hasSceneLink) {
              return session;
            }
            return {
              ...session,
              scenes: session.scenes.map((scene) =>
                scene.placeId === placeId
                  ? { ...scene, placeId: undefined }
                  : scene,
              ),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      createSession() {
        const timestamp = nowIso();
        const sessionId = createId("session");
        setData((prev) => ({
          ...prev,
          sessions: [
            ...prev.sessions,
            {
              id: sessionId,
              title: "Nouvelle session",
              objective: "",
              notes: "",
              scenes: [],
              inTimeline: true,
              timelineOrder:
                prev.sessions.filter((session) => session.inTimeline).length +
                1,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        }));
        return sessionId;
      },
      deleteSession(sessionId) {
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((session) => session.id !== sessionId),
        }));
      },
      updateSession(sessionId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, ...fields, updatedAt: timestamp }
              : session,
          ),
        }));
      },
      addScene(sessionId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            const nextOrder = session.scenes.length + 1;
            return {
              ...session,
              scenes: [
                ...session.scenes,
                {
                  id: createId("scene"),
                  title: `Scène ${nextOrder}`,
                  text: "",
                  order: nextOrder,
                  linkedNpcIds: [],
                },
              ],
              updatedAt: timestamp,
            };
          }),
        }));
      },
      updateScene(sessionId, sceneId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) =>
                scene.id === sceneId ? { ...scene, ...fields } : scene,
              ),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      addSceneLiveNote(sessionId, targetSceneId, text, createdFromSceneId) {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return;
        }
        const timestamp = nowIso();
        const timestampMs = nowMs();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) => {
                if (scene.id !== targetSceneId) {
                  return scene;
                }

                const nextNotes = [
                  ...(scene.liveNotes ?? []),
                  {
                    id: createId("note"),
                    text: trimmedText,
                    createdAt: timestampMs,
                    createdFromSceneId,
                  },
                ];
                return { ...scene, liveNotes: nextNotes };
              }),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      removeSceneLiveNote(sessionId, sceneId, noteId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) => {
                if (scene.id !== sceneId) {
                  return scene;
                }

                return {
                  ...scene,
                  liveNotes: (scene.liveNotes ?? []).filter(
                    (note) => note.id !== noteId,
                  ),
                };
              }),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      addSceneChoice(sessionId, sceneId, choice) {
        const trimmedLabel = choice.label.trim();
        if (!trimmedLabel) {
          return;
        }
        if (!choice.targetId) {
          return;
        }
        const timestamp = nowIso();
        const choiceId = createId("choice");
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) => {
                if (scene.id !== sceneId) {
                  return scene;
                }
                const nextChoices = [
                  ...(scene.choices ?? []),
                  {
                    id: choiceId,
                    label: trimmedLabel,
                    targetType: choice.targetType,
                    targetId: choice.targetId,
                  },
                ];
                return { ...scene, choices: nextChoices };
              }),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      removeSceneChoice(sessionId, sceneId, choiceId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) => {
                if (scene.id !== sceneId) {
                  return scene;
                }
                return {
                  ...scene,
                  choices: (scene.choices ?? []).filter(
                    (choice) => choice.id !== choiceId,
                  ),
                };
              }),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      deleteScene(sessionId, sceneId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: moveToSequentialOrder(
                session.scenes.filter((scene) => scene.id !== sceneId),
              ),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      moveScene(sessionId, sceneId, direction) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: swapOrderedItem(session.scenes, sceneId, direction),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      createNpc() {
        const timestamp = nowIso();
        const npcId = createId("npc");
        setData((prev) => ({
          ...prev,
          npcs: [
            ...prev.npcs,
            {
              id: npcId,
              name: "Nouveau PNJ",
              role: "",
              locationText: "",
              description: "",
              notes: "",
              attitude: "neutral",
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        }));
        return npcId;
      },
      deleteNpc(npcId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          npcs: prev.npcs.filter((npc) => npc.id !== npcId),
          sessions: prev.sessions.map((session) => {
            const hasSceneLink = session.scenes.some((scene) =>
              scene.linkedNpcIds.includes(npcId),
            );
            if (!hasSceneLink) {
              return session;
            }
            return {
              ...session,
              scenes: session.scenes.map((scene) => ({
                ...scene,
                linkedNpcIds: scene.linkedNpcIds.filter((id) => id !== npcId),
              })),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      updateNpc(npcId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          npcs: prev.npcs.map((npc) =>
            npc.id === npcId
              ? { ...npc, ...fields, updatedAt: timestamp }
              : npc,
          ),
        }));
      },
      createPlayerCharacter() {
        const timestamp = nowIso();
        const pcId = createId("pc");
        setData((prev) => ({
          ...prev,
          pcs: [
            ...(prev.pcs ?? []),
            {
              id: pcId,
              name: "Nouveau PJ",
              role: "",
              hpCurrent: 10,
              hpMax: 10,
              stats: { for: 10, dex: 10, int: 10, con: 10 },
              conditions: [],
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ],
        }));
        return pcId;
      },
      deletePlayerCharacter(pcId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          pcs: (prev.pcs ?? []).filter((pc) => pc.id !== pcId),
          sessions: prev.sessions.map((session) => ({
            ...session,
            updatedAt: timestamp,
          })),
        }));
      },
      updatePlayerCharacter(pcId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          pcs: (prev.pcs ?? []).map((pc) =>
            pc.id === pcId ? { ...pc, ...fields, updatedAt: timestamp } : pc,
          ),
        }));
      },
      moveSessionTimeline(sessionId, direction) {
        const timestamp = nowIso();
        setData((prev) => {
          const timelineSessions = prev.sessions
            .filter((session) => session.inTimeline)
            .sort((a, b) => a.timelineOrder - b.timelineOrder);
          const index = timelineSessions.findIndex(
            (session) => session.id === sessionId,
          );
          if (index === -1) {
            return prev;
          }

          const nextIndex = direction === "up" ? index - 1 : index + 1;
          if (nextIndex < 0 || nextIndex >= timelineSessions.length) {
            return prev;
          }

          const swapped = [...timelineSessions];
          const temp = swapped[index];
          swapped[index] = swapped[nextIndex];
          swapped[nextIndex] = temp;

          const reordered = swapped.map((session, orderIndex) => ({
            ...session,
            timelineOrder: orderIndex + 1,
            updatedAt: timestamp,
          }));

          const reorderMap = new Map(
            reordered.map((session) => [session.id, session]),
          );
          return {
            ...prev,
            sessions: prev.sessions.map(
              (session) => reorderMap.get(session.id) ?? session,
            ),
          };
        });
      },
      setSceneNpcLink(sessionId, sceneId, npcId, linked) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.map((scene) => {
                if (scene.id !== sceneId) {
                  return scene;
                }

                const nextIds = linked
                  ? uniqueIds([...scene.linkedNpcIds, npcId])
                  : scene.linkedNpcIds.filter((id) => id !== npcId);
                return { ...scene, linkedNpcIds: nextIds };
              }),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      resetDemoData() {
        store.clear();
        setData(ensureAppData(cloneDemoData()));
      },
      replaceData(raw) {
        if (!isAppData(raw)) {
          return { ok: false, error: "Format de sauvegarde invalide." };
        }
        setData(ensureAppData(raw));
        return { ok: true };
      },
    }),
    [data, lastSavedAt],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
