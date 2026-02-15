import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cloneDemoData } from "../lib/demoData";
import { createId } from "../lib/id";
import { createLocalStorageStore } from "../lib/storage";
import type { AppData, Campaign, Npc, Scene, Session } from "../models";

interface AppDataContextValue {
  data: AppData;
  lastSavedAt: string | null;
  updateCampaign(fields: Partial<Omit<Campaign, "id" | "timelineItems">>): void;
  addTimelineItem(text: string): void;
  updateTimelineItem(itemId: string, text: string): void;
  removeTimelineItem(itemId: string): void;
  moveTimelineItem(itemId: string, direction: "up" | "down"): void;
  moveSessionTimeline(sessionId: string, direction: "up" | "down"): void;
  createSession(): string;
  deleteSession(sessionId: string): void;
  updateSession(sessionId: string, fields: Partial<Omit<Session, "id" | "scenes">>): void;
  addScene(sessionId: string): void;
  updateScene(sessionId: string, sceneId: string, fields: Partial<Omit<Scene, "id" | "order">>): void;
  deleteScene(sessionId: string, sceneId: string): void;
  moveScene(sessionId: string, sceneId: string, direction: "up" | "down"): void;
  setSceneNpcLink(sessionId: string, sceneId: string, npcId: string, linked: boolean): void;
  createNpc(): string;
  deleteNpc(npcId: string): void;
  updateNpc(npcId: string, fields: Partial<Omit<Npc, "id">>): void;
  resetDemoData(): void;
  replaceData(raw: unknown): { ok: boolean; error?: string };
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);
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

function ensureTimestamp(value: string | undefined, fallback: string): string {
  return value ?? fallback;
}

function ensureCampaignTimestamps(campaign: Campaign): Campaign {
  const fallback = nowIso();
  return {
    ...campaign,
    createdAt: ensureTimestamp(campaign.createdAt, fallback),
    updatedAt: ensureTimestamp(campaign.updatedAt, fallback)
  };
}

function ensureSessionTimestamps(session: Session): Session {
  const fallback = nowIso();
  return {
    ...session,
    scenes: session.scenes.map((scene) => ({
      ...scene,
      linkedNpcIds: scene.linkedNpcIds ?? []
    })),
    inTimeline: session.inTimeline ?? true,
    timelineOrder: session.timelineOrder ?? 0,
    createdAt: ensureTimestamp(session.createdAt, fallback),
    updatedAt: ensureTimestamp(session.updatedAt, fallback)
  };
}

function ensureNpcTimestamps(npc: Npc): Npc {
  const fallback = nowIso();
  return {
    ...npc,
    attitude: npc.attitude ?? "neutral",
    createdAt: ensureTimestamp(npc.createdAt, fallback),
    updatedAt: ensureTimestamp(npc.updatedAt, fallback)
  };
}

function ensureAppData(data: AppData): AppData {
  const normalized = {
    ...data,
    campaign: ensureCampaignTimestamps(data.campaign),
    sessions: data.sessions.map(ensureSessionTimestamps),
    npcs: data.npcs.map(ensureNpcTimestamps)
  };
  const withTimeline = {
    ...normalized,
    sessions: normalized.sessions.map((session, index) => ({
      ...session,
      timelineOrder: session.timelineOrder && session.timelineOrder > 0 ? session.timelineOrder : index + 1
    }))
  };
  return withTimeline;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isScene(value: unknown): value is Scene {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.text === "string" &&
    typeof value.order === "number" &&
    isStringArray(value.linkedNpcIds)
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
    attitude === "friendly" || attitude === "neutral" || attitude === "wary" || attitude === "hostile";
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

function isCampaign(value: unknown): value is Campaign {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.tone === "string" &&
    Array.isArray(value.timelineItems)
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
    value.npcs.every(isNpc)
  );
}

function swapOrderedItem<T extends { order: number; id: string }>(
  items: T[],
  itemId: string,
  direction: "up" | "down"
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
    store.save(data);
    setLastSavedAt(nowIso());
  }, [data]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      lastSavedAt,
      updateCampaign(fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: { ...prev.campaign, ...fields, updatedAt: timestamp }
        }));
      },
      addTimelineItem(text) {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return;
        }

        const timestamp = nowIso();
        setData((prev) => {
          const nextOrder = prev.campaign.timelineItems.length + 1;
          return {
            ...prev,
            campaign: {
              ...prev.campaign,
              timelineItems: [
                ...prev.campaign.timelineItems,
                { id: createId("timeline"), text: trimmedText, order: nextOrder }
              ],
              updatedAt: timestamp
            }
          };
        });
      },
      updateTimelineItem(itemId, text) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            timelineItems: prev.campaign.timelineItems.map((item) =>
              item.id === itemId ? { ...item, text } : item
            ),
            updatedAt: timestamp
          }
        }));
      },
      removeTimelineItem(itemId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            timelineItems: moveToSequentialOrder(
              prev.campaign.timelineItems.filter((item) => item.id !== itemId)
            ),
            updatedAt: timestamp
          }
        }));
      },
      moveTimelineItem(itemId, direction) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            timelineItems: swapOrderedItem(prev.campaign.timelineItems, itemId, direction),
            updatedAt: timestamp
          }
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
              timelineOrder: prev.sessions.filter((session) => session.inTimeline).length + 1,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          ]
        }));
        return sessionId;
      },
      deleteSession(sessionId) {
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((session) => session.id !== sessionId)
        }));
      },
      updateSession(sessionId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) =>
            session.id === sessionId ? { ...session, ...fields, updatedAt: timestamp } : session
          )
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
                  linkedNpcIds: []
                }
              ],
              updatedAt: timestamp
            };
          })
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
                scene.id === sceneId ? { ...scene, ...fields } : scene
              ),
              updatedAt: timestamp
            };
          })
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
              scenes: moveToSequentialOrder(session.scenes.filter((scene) => scene.id !== sceneId)),
              updatedAt: timestamp
            };
          })
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
              updatedAt: timestamp
            };
          })
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
              updatedAt: timestamp
            }
          ]
        }));
        return npcId;
      },
      deleteNpc(npcId) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          npcs: prev.npcs.filter((npc) => npc.id !== npcId),
          sessions: prev.sessions.map((session) => {
            const hasSceneLink = session.scenes.some((scene) => scene.linkedNpcIds.includes(npcId));
            if (!hasSceneLink) {
              return session;
            }
            return {
              ...session,
              scenes: session.scenes.map((scene) => ({
                ...scene,
                linkedNpcIds: scene.linkedNpcIds.filter((id) => id !== npcId)
              })),
              updatedAt: timestamp
            };
          })
        }));
      },
      updateNpc(npcId, fields) {
        const timestamp = nowIso();
        setData((prev) => ({
          ...prev,
          npcs: prev.npcs.map((npc) =>
            npc.id === npcId ? { ...npc, ...fields, updatedAt: timestamp } : npc
          )
        }));
      },
      moveSessionTimeline(sessionId, direction) {
        const timestamp = nowIso();
        setData((prev) => {
          const timelineSessions = prev.sessions
            .filter((session) => session.inTimeline)
            .sort((a, b) => a.timelineOrder - b.timelineOrder);
          const index = timelineSessions.findIndex((session) => session.id === sessionId);
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
            updatedAt: timestamp
          }));

          const reorderMap = new Map(reordered.map((session) => [session.id, session]));
          return {
            ...prev,
            sessions: prev.sessions.map((session) => reorderMap.get(session.id) ?? session)
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
              updatedAt: timestamp
            };
          })
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
      }
    }),
    [data, lastSavedAt]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
