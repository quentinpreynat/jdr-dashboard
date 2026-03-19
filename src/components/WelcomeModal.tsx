export type WelcomeModalProps = {
  onClose: () => void;
};

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[8px] border-2 border-[#8b5e2a] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        style={{
          background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
          fontFamily: "'Cinzel', serif",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#5a3010]">
            Bienvenue, Maître du Jeu ! 🎲
          </h2>
          <p
            className="mt-3 text-sm text-stone-700"
            style={{ fontFamily: "'Crimson Text', serif" }}
          >
            Cette application va t'aider à mener tes sessions. On va commencer
            simplement — tu débloqueras les fonctionnalités avancées au fur et à
            mesure.
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="btn-gold-medieval px-5 py-2 text-sm"
          >
            C&apos;est parti ! →
          </button>
        </div>
      </div>
    </div>
  );
}
