import { useEffect, useRef, useState } from "react";
import { useSettings } from "../state/SettingsContext";

type HelpItem = {
  icon: string;
  label: string;
  action: () => void;
  hideIf?: boolean;
};

export function HelpMenu() {
  const { settings, updateSettings, resetTutorial } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowAbout(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!showAbout) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowAbout(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAbout]);

  useEffect(() => {
    const updateModalState = () => {
      const dialog = document.querySelector("[role='dialog'][aria-modal='true']");
      setIsModalOpen(Boolean(dialog));
    };
    updateModalState();
    const observer = new MutationObserver(updateModalState);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const isDetailPage = window.location.pathname.includes("/sessions/") &&
    !window.location.pathname.includes("/live");

  const helpItems: HelpItem[] = [
    {
      icon: "🎓",
      label: "Rejouer le tutoriel",
      action: () => {
        if (isDetailPage) {
          window.dispatchEvent(new CustomEvent("mj-open-detail-tutorial"));
        } else {
          resetTutorial();
        }
        setIsOpen(false);
      },
    },
    {
      icon: "📜",
      label: "Voir la checklist",
      action: () => {
        window.dispatchEvent(new CustomEvent("mj-open-checklist"));
        setIsOpen(false);
      },
    },
    {
      icon: "🌱",
      label: "Passer en mode Débutant",
      action: () => {
        updateSettings({ expertMode: false });
        setIsOpen(false);
      },
      hideIf: !settings.expertMode,
    },
    {
      icon: "⚔️",
      label: "Passer en mode Expert",
      action: () => {
        updateSettings({ expertMode: true });
        setIsOpen(false);
      },
      hideIf: settings.expertMode,
    },
    {
      icon: "❓",
      label: "À propos",
      action: () => {
        setShowAbout(true);
        setIsOpen(false);
      },
    },
  ];

  if (isModalOpen && !showAbout) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 left-6"
      style={{ pointerEvents: "auto", zIndex: 1000 }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-center rounded-full border-2 border-[#c9962a] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        style={{
          width: "44px",
          height: "44px",
          background: "linear-gradient(160deg, #fdf6e3, #e8c87a)",
          color: "#5a3010",
          fontFamily: "'Cinzel', serif",
          fontSize: "16px",
        }}
        aria-label="Ouvrir le menu d'aide"
      >
        ❓
      </button>

      {isOpen && (
        <div
          className="absolute bottom-[56px] left-0 w-[220px] rounded-lg border-2 border-[#c9962a] p-3 shadow-[0_12px_26px_rgba(0,0,0,0.35)]"
          style={{
            background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
            fontFamily: "'Cinzel', serif",
          }}
        >
          <div className="space-y-1">
            {helpItems
              .filter((item) => !item.hideIf)
              .map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#5a3010] hover:bg-[#ead59a]"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="À propos"
          onMouseDown={() => setShowAbout(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border-2 border-[#c9962a] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
            style={{
              background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
              fontFamily: "'Cinzel', serif",
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#5a3010]">
              Journal du MJ
            </h3>
            <p className="mt-2 text-sm text-stone-700">
              Version 0.1 — Tableau de bord pour maîtriser vos campagnes et
              sessions.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="btn-gold-medieval px-4 py-2 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
