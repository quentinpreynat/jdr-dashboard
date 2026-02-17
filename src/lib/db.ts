import Dexie, { Table } from "dexie";
import type { Campaign } from "../models";

type SnapshotRecord = {
  id: string;
  createdAt: number;
  data: unknown;
};

class AppDB extends Dexie {
  campaigns!: Table<Campaign, string>;
  snapshots!: Table<SnapshotRecord, string>;

  constructor() {
    super("app-db");

    // Minimal indexes for current needs and future migration.
    this.version(1).stores({
      campaigns: "id, title",
      snapshots: "id, createdAt",
    });
  }
}

export const db = new AppDB();

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Fallback for older runtimes.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function putCampaign(c: Campaign): Promise<void> {
  await db.campaigns.put(c);
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  return db.campaigns.toArray();
}

export async function addSnapshot(data: unknown): Promise<string> {
  const id = createId();
  await db.snapshots.put({ id, createdAt: Date.now(), data });
  return id;
}

export async function getSnapshots(
  limit = 20
): Promise<{ id: string; createdAt: number }[]> {
  const rows = await db.snapshots
    .orderBy("createdAt")
    .reverse()
    .limit(limit)
    .toArray();
  return rows.map((row) => ({ id: row.id, createdAt: row.createdAt }));
}

export async function pruneSnapshots(keep = 20): Promise<void> {
  if (keep <= 0) {
    await db.snapshots.clear();
    return;
  }

  const ids = await db.snapshots
    .orderBy("createdAt")
    .reverse()
    .offset(keep)
    .primaryKeys();

  if (ids.length > 0) {
    await db.snapshots.bulkDelete(ids as string[]);
  }
}
