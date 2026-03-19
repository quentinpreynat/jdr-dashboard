import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type TutorialVariant = "live" | "detail";

export type TutorialOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  variant?: TutorialVariant;
};

type Step = {
  title: string;
  description: string;
  target: string | null;
};

const STEPS_LIVE: Step[] = [
  {
    title: "Bienvenue dans la Session Live !",
    description:
      "Ce tutoriel va t'accompagner pas à pas pour mener ta session. Clique sur Suivant pour commencer.",
    target: null,
  },
  {
    title: "La scène active",
    description:
      "Ici s'affiche la scène en cours. Le texte descriptif est celui que tu lis à voix haute à tes joueurs pour poser l'ambiance.",
    target: "scene-text",
  },
  {
    title: "Les choix",
    description:
      "Ces boutons représentent les options proposées à tes joueurs. Clique dessus pendant la partie pour voir le lieu ou le PNJ associé. Tu crées les choix depuis la page de détail de ta session.",
    target: "choices-panel",
  },
  {
    title: "Les notes de scène",
    description:
      "Utilise la zone Notes pour noter tout ce qui se passe en cours de partie — décisions des joueurs, événements imprévus. Elles sont sauvegardées automatiquement.",
    target: "notes-panel",
  },
  {
    title: "C'est parti !",
    description:
      "Tu es prêt à mener ta session ! Si tu te perds, clique sur le bouton ❓ en bas à gauche pour revoir ce tutoriel.",
    target: null,
  },
];

const STEPS_DETAIL: Step[] = [
  {
    title: "Bienvenue dans les détails de session !",
    description:
      "C'est ici que tu prépares tout avant de lancer ta session. Voyons ensemble comment organiser ton aventure.",
    target: null,
  },
  {
    title: "Titre et objectif",
    description:
      "Commence par donner un titre à ta session et définir son objectif principal — ce que tes joueurs doivent accomplir ou découvrir dans cette session.",
    target: "detail-session-info",
  },
  {
    title: "Notes du MJ",
    description:
      "Cet espace est pour toi seul. Note tes idées, tes rappels, les secrets de la session que tes joueurs ne doivent pas connaître.",
    target: "detail-notes",
  },
  {
    title: "Ajouter une scène",
    description:
      "Clique sur ce bouton pour créer une nouvelle scène. Chaque scène représente un moment clé de ta session : une rencontre, un lieu à explorer, un événement dramatique.",
    target: "detail-add-scene",
  },
  {
    title: "Remplir une scène",
    description:
      "Donne un titre et un texte descriptif à ta scène. Ce texte sera affiché pendant la session live quand tu la sélectionnes — c'est ce que tu lis à tes joueurs.",
    target: "detail-scenes-list",
  },
  {
    title: "Associer un lieu à la scène",
    description:
      "Dans chaque scène, tu peux choisir un lieu de ta campagne. Cela permet d'y accéder rapidement pendant la partie. Tu crées tes lieux depuis le menu principal → Lieux.",
    target: "detail-scenes-list",
  },
  {
    title: "Ajouter des choix",
    description:
      "Les choix sont les options que tu proposes à tes joueurs. Lie-les à un PNJ ou un lieu — ils apparaîtront comme des boutons cliquables pendant la session live.",
    target: "detail-scenes-list",
  },
  {
    title: "Lancer la session",
    description:
      "Quand tout est prêt, clique sur 'Open Session Live' pour démarrer et accéder au tableau de bord en temps réel. Bonne session !",
    target: "detail-open-live",
  },
];

export function TutorialOverlay({
  isOpen,
  onClose,
  variant = "live",
}: TutorialOverlayProps) {
  const steps = variant === "detail" ? STEPS_DETAIL : STEPS_LIVE;
  const [step, setStep] = useState(0);
  const highlightRef = useRef<HTMLElement | null>(null);
  const current = steps[step];

  // Reset on open
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  // Highlight target element + scroll to it
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.classList.remove("tuto-highlight");
      highlightRef.current = null;
    }
    if (!isOpen || !current.target) return;

    const el = document.querySelector<HTMLElement>(
      `[data-tutorial="${current.target}"]`
    );
    if (!el) return;

    el.classList.add("tuto-highlight");
    highlightRef.current = el;
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    return () => {
      el.classList.remove("tuto-highlight");
    };
  }, [isOpen, step, current.target]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && highlightRef.current) {
      highlightRef.current.classList.remove("tuto-highlight");
      highlightRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Render via portal directly into document.body to escape any overflow/z-index constraints
  return createPortal(
    <>
      {/* CSS highlight animation */}
      <style>{`
        .tuto-highlight {
          outline: 3px solid #c9962a !important;
          outline-offset: 5px !important;
          border-radius: 8px !important;
          position: relative !important;
          z-index: 99999 !important;
          animation: tuto-pulse 1.8s ease-in-out infinite !important;
        }
        @keyframes tuto-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(201,150,42,0.6), 0 0 20px 6px rgba(201,150,42,0.3); }
          50%       { box-shadow: 0 0 16px 6px rgba(201,150,42,0.8), 0 0 32px 12px rgba(201,150,42,0.2); }
        }
      `}</style>

      {/* Fond grisé — couvre toute la page, portailé dans body */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99000,
          background: "rgba(0,0,0,0.65)",
          pointerEvents: "all",
        }}
      />

      {/* Fenêtre tutoriel — centrée en bas */}
      <div
        style={{
          position: "fixed",
          bottom: "36px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          width: "min(440px, calc(100vw - 32px))",
          fontFamily: "'Cinzel', serif",
          background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
          border: "3px solid #c9962a",
          borderRadius: "12px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.75), 0 0 0 2px rgba(201,150,42,0.4)",
          padding: "1.25rem 1.5rem",
        }}
      >
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#6b4c10", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
            Étape {step + 1} / {steps.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#8a6010", padding: 0, lineHeight: 1 }}
            aria-label="Fermer le tutoriel"
          >
            ✕
          </button>
        </div>

        {/* Barre de progression */}
        <div style={{ height: "4px", background: "#e5d3a6", borderRadius: "99px", marginBottom: "0.85rem" }}>
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / steps.length) * 100}%`,
              background: "linear-gradient(90deg, #c9962a, #8a6010)",
              borderRadius: "99px",
              transition: "width 220ms ease",
            }}
          />
        </div>

        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#2c1a06", marginBottom: "0.5rem" }}>
          🎓 {current.title}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#2c1a06", lineHeight: 1.65, fontFamily: "'Crimson Text', serif", margin: 0 }}>
          {current.description}
        </p>

        {/* Boutons navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.1rem", gap: "0.5rem" }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "6px",
              border: "1.5px solid #c9962a",
              background: step === 0 ? "rgba(201,150,42,0.06)" : "rgba(201,150,42,0.15)",
              color: step === 0 ? "#c9b06a" : "#5a3010",
              cursor: step === 0 ? "default" : "pointer",
              fontSize: "0.82rem",
              fontFamily: "'Cinzel', serif",
            }}
          >
            ← Précédent
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "6px",
                border: "none",
                background: "linear-gradient(160deg, #c9962a, #8a6010)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
              }}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "6px",
                border: "none",
                background: "linear-gradient(160deg, #2d8a4e, #1a5c30)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontFamily: "'Cinzel', serif",
                fontWeight: 600,
              }}
            >
              ✓ Terminer
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
