import type { AppData, Npc, Place, PlayerCharacter, Session } from "../models";

export const CAMPAIGNS_STORAGE_KEY = "mj-campaigns";
export const CURRENT_CAMPAIGN_STORAGE_KEY = "mj-current-campaign";

// Note: In the current codebase, "sessions" are the top-level timeline items.
// The user prompt uses the term "scenes" for the top-level list, so we store
// sessions under the `scenes` key to match the requested storage shape.
export interface Campaign {
  id: string;
  title: string;
  createdAt: number;
  summary?: string;
  tone?: string;
  updatedAt?: number;
  scenes: Session[];
  npcs: Npc[];
  places: Place[];
  players: PlayerCharacter[];
}

type ParsedCampaign = Partial<Campaign> & { id?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeCampaign(raw: ParsedCampaign): Campaign | null {
  const id = toString(raw.id);
  const title = toString(raw.title);
  if (!id || !title) {
    return null;
  }

  const createdAtRaw = (raw as Record<string, unknown>).createdAt;
  const createdAt =
    toNumber(createdAtRaw) ??
    (typeof createdAtRaw === "string" ? Date.parse(createdAtRaw) : NaN);

  return {
    id,
    title,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    summary: toString((raw as Record<string, unknown>).summary) ?? undefined,
    tone: toString((raw as Record<string, unknown>).tone) ?? undefined,
    updatedAt: toNumber((raw as Record<string, unknown>).updatedAt) ?? undefined,
    scenes: toArray<Session>((raw as Record<string, unknown>).scenes),
    npcs: toArray<Npc>((raw as Record<string, unknown>).npcs),
    places: toArray<Place>((raw as Record<string, unknown>).places),
    players: toArray<PlayerCharacter>((raw as Record<string, unknown>).players),
  };
}

export function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => (isRecord(entry) ? normalizeCampaign(entry) : null))
      .filter((entry): entry is Campaign => Boolean(entry));
  } catch (error) {
    console.error("Campaigns: failed to read from localStorage", error);
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error("Campaigns: failed to write to localStorage", error);
  }
}

export function getCurrentCampaignId(): string | null {
  try {
    const value = localStorage.getItem(CURRENT_CAMPAIGN_STORAGE_KEY);
    return value && typeof value === "string" ? value : null;
  } catch (error) {
    console.error("Campaigns: failed to read current campaign id", error);
    return null;
  }
}

export function setCurrentCampaignId(id: string): void {
  try {
    localStorage.setItem(CURRENT_CAMPAIGN_STORAGE_KEY, id);
  } catch (error) {
    console.error("Campaigns: failed to write current campaign id", error);
  }
}

export const LEGACY_APPDATA_STORAGE_KEY = "tor-gm-v1-data";

export function loadLegacyAppData(): AppData | null {
  try {
    const raw = localStorage.getItem(LEGACY_APPDATA_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return null;
  }
}
