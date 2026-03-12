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
import {
  getCurrentCampaignId,
  loadCampaigns,
  loadLegacyAppData,
  saveCampaigns,
  setCurrentCampaignId,
  type Campaign as StoredCampaign,
} from "../storage/campaignStorage";
import type {
  AppData,
  Campaign as CampaignMeta,
  Npc,
  Place,
  PlayerCharacter,
  Scene,
  Session,
} from "../models";

interface AppDataContextValue {
  data: AppData;
  lastSavedAt: string | null;
  campaigns: StoredCampaign[];
  currentCampaign: StoredCampaign | null;
  selectCampaign(id: string): void;
  createCampaign(title: string): string;
  deleteCampaign(id: string): void;
  updateCampaign(fields: Partial<Omit<CampaignMeta, "id">>): void;
  addGlobalNote(text: string): void;
  removeGlobalNote(noteId: string): void;
  addPlace(campaignId: string, place: Omit<Place, "id">): string;
  updatePlace(
    campaignId: string,
    placeId: string,
    fields: Partial<Omit<Place, "id">>,
  ): void;
  removePlace(campaignId: string, placeId: string): void;
  findCampaignBySessionId(sessionId: string): CampaignMeta | null;
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
    fields: Partial<Omit<Scene, "id">>,
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

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

type CampaignState = {
  campaigns: StoredCampaign[];
  currentId: string;
};

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

function ensureCampaignTimestamps(campaign: CampaignMeta): CampaignMeta {
  const fallback = nowIso();
  return {
    ...campaign,
    places: campaign.places ?? [],
    globalNotes: (campaign.globalNotes ?? []).map((note) => {
      const createdAt =
        typeof note.createdAt === "number"
          ? note.createdAt
          : Date.parse(String(note.createdAt));
      return {
        ...note,
        createdAt: Number.isFinite(createdAt) ? createdAt : nowMs(),
      };
    }),
    createdAt: ensureTimestamp(campaign.createdAt, fallback),
    updatedAt: ensureTimestamp(campaign.updatedAt, fallback),
  };
}

function ensureSessionTimestamps(session: Session): Session {
  const fallback = nowIso();
  return {
    ...session,
    scenes: session.scenes.map((scene) => {
      const { order: _order, done: _done, ...rest } = scene as Scene & {
        order?: number;
        done?: boolean;
      };
      return {
        ...rest,
        linkedNpcIds: rest.linkedNpcIds ?? [],
        choices: rest.choices ?? [],
        liveNotes: (rest.liveNotes ?? []).map((note) => ({
          ...note,
          createdAt:
            typeof note.createdAt === "number"
              ? note.createdAt
              : Date.parse(String(note.createdAt)),
        })),
      };
    }),
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
    data.campaign as CampaignMeta & {
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

function isGlobalNote(
  value: unknown,
): value is { id: string; text: string; createdAt: number } {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    typeof value.createdAt === "number"
  );
}

function isSceneChoice(
  value: unknown,
): value is {
  id: string;
  label: string;
  targetType: "place" | "npc";
  targetId: string;
  intent?: unknown;
} {
  if (!isRecord(value)) {
    return false;
  }
  const targetType = value.targetType;
  const validTargetType = targetType === "place" || targetType === "npc";
  const targetId = value.targetId;
  const intent = value.intent;
  const validIntent =
    intent === undefined ||
    intent === "explore" ||
    intent === "search" ||
    intent === "move" ||
    intent === "talk" ||
    intent === "attack" ||
    intent === "other";
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    validTargetType &&
    typeof targetId === "string" &&
    validIntent
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
    (linkedNpcIds === undefined || isStringArray(linkedNpcIds)) &&
    (placeId === undefined || typeof placeId === "string") &&
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

function isCampaign(value: unknown): value is CampaignMeta {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.tone === "string" &&
    (value.globalNotes === undefined ||
      (Array.isArray(value.globalNotes) && value.globalNotes.every(isGlobalNote))) &&
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

function isoToMs(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function campaignToAppData(campaign: StoredCampaign): AppData {
  const createdAt = new Date(campaign.createdAt).toISOString();
  const updatedAt = new Date(
    campaign.updatedAt ?? campaign.createdAt,
  ).toISOString();
  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      summary: campaign.summary ?? "",
      tone: campaign.tone ?? "",
      places: campaign.places ?? [],
      globalNotes: campaign.globalNotes ?? [],
      createdAt,
      updatedAt,
    },
    sessions: campaign.scenes ?? [],
    npcs: campaign.npcs ?? [],
    pcs: campaign.players ?? [],
  };
}

function appDataToCampaign(
  previous: StoredCampaign,
  next: AppData,
): StoredCampaign {
  return {
    ...previous,
    id: previous.id,
    title: next.campaign.title,
    createdAt: previous.createdAt,
    summary: next.campaign.summary,
    tone: next.campaign.tone,
    updatedAt: isoToMs(next.campaign.updatedAt, Date.now()),
    places: next.campaign.places ?? [],
    globalNotes: next.campaign.globalNotes ?? [],
    scenes: next.sessions,
    npcs: next.npcs,
    players: next.pcs ?? [],
  };
}

function createBlankCampaign(title: string): StoredCampaign {
  const timestamp = nowMs();
  return {
    id: createId("campaign"),
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    summary: "",
    tone: "",
    places: [],
    globalNotes: [],
    scenes: [],
    npcs: [],
    players: [],
  };
}

function createInitialCampaignState(): CampaignState {
  const persisted = loadCampaigns();
  const persistedCurrent = getCurrentCampaignId();

  if (persisted.length > 0) {
    const currentId = persisted.some((c) => c.id === persistedCurrent)
      ? (persistedCurrent as string)
      : persisted[0].id;
    return { campaigns: persisted, currentId };
  }

  const legacyRaw = loadLegacyAppData();
  const legacySeed =
    legacyRaw && isAppData(legacyRaw) ? ensureAppData(legacyRaw) : null;

  if (legacySeed) {
    const createdAt = isoToMs(legacySeed.campaign.createdAt, nowMs());
    const updatedAt = isoToMs(legacySeed.campaign.updatedAt, createdAt);
    const seeded: StoredCampaign = {
      id: legacySeed.campaign.id,
      title: legacySeed.campaign.title,
      createdAt,
      updatedAt,
      summary: legacySeed.campaign.summary,
      tone: legacySeed.campaign.tone,
      places: legacySeed.campaign.places ?? [],
      globalNotes: legacySeed.campaign.globalNotes ?? [],
      scenes: legacySeed.sessions,
      npcs: legacySeed.npcs,
      players: legacySeed.pcs ?? [],
    };
    return { campaigns: [seeded], currentId: seeded.id };
  }

  const first = createBlankCampaign("Campagne 1");
  return { campaigns: [first], currentId: first.id };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CampaignState>(createInitialCampaignState);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const currentCampaign = useMemo(
    () => state.campaigns.find((campaign) => campaign.id === state.currentId) ?? null,
    [state.campaigns, state.currentId],
  );

  const data = useMemo(() => {
    if (!currentCampaign) {
      return ensureAppData(cloneDemoData());
    }
    return ensureAppData(campaignToAppData(currentCampaign));
  }, [currentCampaign]);

  const updateCurrentCampaignData = (updater: (prev: AppData) => AppData) => {
    setState((prev) => {
      const index = prev.campaigns.findIndex(
        (campaign) => campaign.id === prev.currentId,
      );
      if (index === -1) {
        return prev;
      }
      const previousCampaign = prev.campaigns[index];
      const previousData = ensureAppData(campaignToAppData(previousCampaign));
      const nextDataRaw = updater(previousData);
      const nextData = ensureAppData({
        ...nextDataRaw,
        campaign: { ...nextDataRaw.campaign, id: previousCampaign.id },
      });
      const nextCampaign = appDataToCampaign(previousCampaign, nextData);
      const nextCampaigns = [...prev.campaigns];
      nextCampaigns[index] = nextCampaign;
      return { ...prev, campaigns: nextCampaigns };
    });
  };

  useEffect(() => {
    void migrateIfNeeded();
    void db.open().catch((error) => {
      console.error("IndexedDB: failed to open database", error);
    });
  }, []);

  useEffect(() => {
    saveCampaigns(state.campaigns);
    setLastSavedAt(nowIso());
  }, [state.campaigns]);

  useEffect(() => {
    setCurrentCampaignId(state.currentId);
  }, [state.currentId]);

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
      campaigns: state.campaigns,
      currentCampaign,
      selectCampaign(id) {
        setState((prev) => {
          if (!prev.campaigns.some((campaign) => campaign.id === id)) {
            return prev;
          }
          return { ...prev, currentId: id };
        });
      },
      createCampaign(title) {
        const next = createBlankCampaign(title.trim() || "Nouvelle campagne");
        setState((prev) => ({
          campaigns: [...prev.campaigns, next],
          currentId: next.id,
        }));
        return next.id;
      },
      deleteCampaign(id) {
        setState((prev) => {
          if (prev.campaigns.length <= 1) {
            return prev;
          }
          const nextCampaigns = prev.campaigns.filter(
            (campaign) => campaign.id !== id,
          );
          if (nextCampaigns.length === prev.campaigns.length) {
            return prev;
          }
          const nextCurrentId =
            prev.currentId === id ? nextCampaigns[0]?.id ?? "" : prev.currentId;
          return {
            ...prev,
            campaigns: nextCampaigns,
            currentId: nextCurrentId || nextCampaigns[0].id,
          };
        });
      },
      updateCampaign(fields) {
        const timestamp = nowIso();
        updateCurrentCampaignData((prev) => ({
          ...prev,
          campaign: { ...prev.campaign, ...fields, updatedAt: timestamp },
        }));
      },
      addGlobalNote(text) {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return;
        }
        const timestamp = nowIso();
        const note = {
          id: crypto.randomUUID(),
          text: trimmedText,
          createdAt: nowMs(),
        };
        updateCurrentCampaignData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            globalNotes: [...(prev.campaign.globalNotes ?? []), note],
            updatedAt: timestamp,
          },
        }));
      },
      removeGlobalNote(noteId) {
        const timestamp = nowIso();
        updateCurrentCampaignData((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            globalNotes: (prev.campaign.globalNotes ?? []).filter(
              (note) => note.id !== noteId,
            ),
            updatedAt: timestamp,
          },
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((session) => session.id !== sessionId),
        }));
      },
      updateSession(sessionId, fields) {
        const timestamp = nowIso();
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: [
                ...session.scenes,
                {
                  id: createId("scene"),
                  title: "Nouvelle scène",
                  text: "",
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== sessionId) {
              return session;
            }

            return {
              ...session,
              scenes: session.scenes.filter((scene) => scene.id !== sceneId),
              updatedAt: timestamp,
            };
          }),
        }));
      },
      createNpc() {
        const timestamp = nowIso();
        const npcId = createId("npc");
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
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
        updateCurrentCampaignData((prev) => ({
          ...prev,
          pcs: (prev.pcs ?? []).map((pc) =>
            pc.id === pcId ? { ...pc, ...fields, updatedAt: timestamp } : pc,
          ),
        }));
      },
      moveSessionTimeline(sessionId, direction) {
        const timestamp = nowIso();
        updateCurrentCampaignData((prev) => {
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
        updateCurrentCampaignData((prev) => ({
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
        const demo = ensureAppData(cloneDemoData());
        updateCurrentCampaignData((prev) => ({
          ...demo,
          campaign: { ...demo.campaign, id: prev.campaign.id },
        }));
      },
      replaceData(raw) {
        if (!isAppData(raw)) {
          return { ok: false, error: "Format de sauvegarde invalide." };
        }
        const imported = ensureAppData(raw);
        updateCurrentCampaignData((prev) => ({
          ...imported,
          campaign: { ...imported.campaign, id: prev.campaign.id },
        }));
        return { ok: true };
      },
    }),
    [
      currentCampaign,
      data,
      lastSavedAt,
      state.campaigns,
      state.currentId,
      updateCurrentCampaignData,
    ],
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
