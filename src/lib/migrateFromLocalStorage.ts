import { addSnapshot, db, putCampaign } from "./db";

type AppDataLike = {
  campaign?: unknown;
  sessions?: unknown;
  npcs?: unknown;
};

type AppDataWrapperLike = {
  data?: AppDataLike;
};

function isAppDataLike(value: unknown): value is AppDataLike {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as Record<string, unknown>;
  return "campaign" in v || "sessions" in v || "npcs" in v;
}

export async function migrateIfNeeded(): Promise<void> {
  if (localStorage.getItem("migrated_to_indexeddb") === "1") {
    return;
  }

  const raw = localStorage.getItem("appData");
  if (!raw) {
    localStorage.setItem("migrated_to_indexeddb", "1");
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("Migration: failed to parse localStorage appData", error);
    localStorage.setItem("migrated_to_indexeddb", "1");
    return;
  }

  try {
    const wrapper = parsed as AppDataWrapperLike;
    const candidate = wrapper?.data ?? parsed;

    if (isAppDataLike(candidate) && candidate.campaign) {
      await putCampaign(candidate.campaign as Parameters<typeof putCampaign>[0]);
    } else {
      const directCampaign = (parsed as AppDataLike).campaign;
      if (directCampaign) {
        await db.campaigns.put(directCampaign as Parameters<typeof putCampaign>[0]);
      }
    }

    // Optional: keep a snapshot of the raw payload for debugging/migration history.
    await addSnapshot(parsed);
  } catch (error) {
    console.error("Migration: failed to write to IndexedDB", error);
  } finally {
    // Mark as migrated to prevent retry loops; leave appData untouched for rollback.
    localStorage.setItem("migrated_to_indexeddb", "1");
  }
}
