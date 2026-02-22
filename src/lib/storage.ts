import type { AppData } from "../models";

const STORAGE_KEY = "tor-gm-v1-data";

export interface DataStore {
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}

export function createLocalStorageStore(key: string = STORAGE_KEY): DataStore {
  // This factory makes storage swappable (e.g. IndexedDB adapter later).
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) {
          return null;
        }
        return JSON.parse(raw) as AppData;
      } catch (error) {
        console.error("Failed to read from localStorage", error);
        return null;
      }
    },
    save(data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to write to localStorage", error);
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error("Failed to clear localStorage", error);
      }
    },
  };
}
