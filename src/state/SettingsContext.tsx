import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppSettings } from "../types/settings";
import { defaultSettings } from "../types/settings";

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (fields: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "jdr-dashboard-settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeSettings(raw: unknown): AppSettings {
  if (!isRecord(raw)) {
    return defaultSettings;
  }
  return {
    improvisationEnabled:
      typeof raw.improvisationEnabled === "boolean"
        ? raw.improvisationEnabled
        : defaultSettings.improvisationEnabled,
  };
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }
    return normalizeSettings(JSON.parse(stored) as unknown);
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [settings]);

  const value = useMemo<SettingsContextValue>(() => {
    return {
      settings,
      updateSettings: (fields) =>
        setSettings((prev) => normalizeSettings({ ...prev, ...fields })),
      resetSettings: () => setSettings(defaultSettings),
    };
  }, [settings]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return value;
}

