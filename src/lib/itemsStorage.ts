import { createId } from "./id";
import type { Item } from "../types/item";

const STORAGE_KEY = "mj-items";

function safeParseItems(raw: string | null): Item[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is Item => {
      if (!value || typeof value !== "object") {
        return false;
      }
      const record = value as Record<string, unknown>;
      const linkedNpcIds = record.linkedNpcIds;
      const linkedPlaceIds = record.linkedPlaceIds;
      const notes = record.notes;
      return (
        typeof record.id === "string" &&
        typeof record.name === "string" &&
        typeof record.description === "string" &&
        (linkedNpcIds === undefined ||
          (Array.isArray(linkedNpcIds) &&
            linkedNpcIds.every((id) => typeof id === "string"))) &&
        (linkedPlaceIds === undefined ||
          (Array.isArray(linkedPlaceIds) &&
            linkedPlaceIds.every((id) => typeof id === "string"))) &&
        (notes === undefined || typeof notes === "string")
      );
    });
  } catch {
    return [];
  }
}

export function getItems(): Item[] {
  try {
    return safeParseItems(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Items: failed to write to localStorage", error);
  }
}

export function addItem(fields: Omit<Item, "id">): string {
  const items = getItems();
  const id = createId("item");
  const next: Item = {
    id,
    name: fields.name,
    description: fields.description,
    linkedNpcIds: fields.linkedNpcIds ?? [],
    linkedPlaceIds: fields.linkedPlaceIds ?? [],
    notes: fields.notes ?? "",
  };
  saveItems([next, ...items]);
  return id;
}

export function updateItem(
  itemId: string,
  fields: Partial<Omit<Item, "id">>,
): void {
  const items = getItems();
  const next = items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }
    const linkedNpcIds =
      fields.linkedNpcIds === undefined
        ? item.linkedNpcIds
        : fields.linkedNpcIds;
    const linkedPlaceIds =
      fields.linkedPlaceIds === undefined
        ? item.linkedPlaceIds
        : fields.linkedPlaceIds;
    return {
      ...item,
      ...fields,
      linkedNpcIds,
      linkedPlaceIds,
    };
  });
  saveItems(next);
}

export function deleteItem(itemId: string): void {
  const items = getItems();
  saveItems(items.filter((item) => item.id !== itemId));
}

