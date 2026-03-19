import { useEffect, useState } from "react";

export type ToastType = "success" | "info" | "warning" | "celebration";

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export type TutorialToastProps = {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function TutorialToast({ messages, onDismiss }: TutorialToastProps) {
  return (
    <div className="fixed top-20 right-6 z-[10001] flex flex-col gap-3 pointer-events-none">
      {messages.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    
    // Démarrer l'animation de sortie avant de dismiss
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
    }, duration - 300);

    // Dismiss après l'animation
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✅";
      case "celebration":
        return "🎉";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getStyles = () => {
    const baseStyles = "px-4 py-3 rounded-lg border-2 shadow-lg font-medium text-sm";
    
    switch (toast.type) {
      case "success":
        return `${baseStyles} bg-green-50 border-green-400 text-green-900`;
      case "celebration":
        return `${baseStyles} bg-gradient-to-r from-amber-50 to-yellow-50 border-[#c9962a] text-[#5a3010]`;
      case "warning":
        return `${baseStyles} bg-orange-50 border-orange-400 text-orange-900`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-900`;
    }
  };

  return (
    <div
      className={`${getStyles()} flex items-center gap-3 pointer-events-auto transition-all duration-300 ${
        isHiding ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
      }`}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => {
          setIsHiding(true);
          setTimeout(onDismiss, 300);
        }}
        className="text-stone-400 hover:text-stone-600 ml-2"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}

// ============================================
// 🎯 HOOK PERSONNALISÉ POUR GÉRER LES TOASTS
// ============================================

export function useTutorialToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    dismissToast,
  };
}

// ============================================
// 📝 EXEMPLE D'UTILISATION
// ============================================

/*
// Dans SessionLivePage.tsx :

import { TutorialToast, useTutorialToasts } from "../components/TutorialToast";

export function SessionLivePage() {
  const { toasts, showToast, dismissToast } = useTutorialToasts();

  // Afficher un toast quand une action est complétée
  const handleNoteAdded = () => {
    addSceneLiveNote(selectedSceneId, noteText);
    
    // Afficher un toast de succès
    showToast("Note ajoutée avec succès ! 📝", "success", 3000);
    
    // Mettre à jour la checklist
    if (!checklistState["first-note"]) {
      updateChecklistItem("first-note", true);
      showToast("Première note complétée ! +15 XP", "celebration", 5000);
    }
  };

  // Afficher un toast pour le passage en mode expert
  const handleSwitchToExpert = () => {
    updateSettings({ expertMode: true });
    showToast("Mode Expert activé ! Toutes les fonctionnalités sont débloquées 🔓", "celebration", 6000);
  };

  return (
    <>
      {/* Vos composants existants * /}
      
      {/* Toast system * /}
      <TutorialToast messages={toasts} onDismiss={dismissToast} />
    </>
  );
}
*/
