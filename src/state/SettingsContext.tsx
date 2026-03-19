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
  resetTutorial: () => void;
  tutorialResetSignal: number;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "jdr-dashboard-settings";
const EXPERT_MODE_KEY = "mj-expert-mode";
const WELCOME_SEEN_KEY = "mj-welcome-seen";
const TUTORIAL_STEP_KEY = "mj-tutorial-step";

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
    expertMode:
      typeof raw.expertMode === "boolean"
        ? raw.expertMode
        : defaultSettings.expertMode,
  };
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const base = stored
      ? normalizeSettings(JSON.parse(stored) as unknown)
      : defaultSettings;
    const storedExpertMode = localStorage.getItem(EXPERT_MODE_KEY);
    if (storedExpertMode === "true") {
      return { ...base, expertMode: true };
    }
    if (storedExpertMode === "false") {
      return { ...base, expertMode: false };
    }
    return base;
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [tutorialResetSignal, setTutorialResetSignal] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      localStorage.setItem(
        EXPERT_MODE_KEY,
        settings.expertMode ? "true" : "false",
      );
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [settings]);

  const value = useMemo<SettingsContextValue>(() => {
    const resetTutorial = () => {
      try {
        localStorage.removeItem(TUTORIAL_STEP_KEY);
        localStorage.removeItem(WELCOME_SEEN_KEY);
      } catch {
        // Ignore storage failures (private mode, quota).
      }
      setTutorialResetSignal((prev) => prev + 1);
      setSettings((prev) =>
        normalizeSettings({ ...prev, expertMode: false }),
      );
    };

    return {
      settings,
      updateSettings: (fields) =>
        setSettings((prev) => normalizeSettings({ ...prev, ...fields })),
      resetSettings: () => setSettings(defaultSettings),
      resetTutorial,
      tutorialResetSignal,
    };
  }, [settings, tutorialResetSignal]);

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
