import { useState } from "react";
import { generateImprovisation } from "../lib/improvisationGenerator";
import type { ImprovisationResult } from "../types/improvisation";

export type ImprovisationModalProps = {
  onClose: () => void;
};

export function ImprovisationModal({ onClose }: ImprovisationModalProps) {
  const [result, setResult] = useState<ImprovisationResult | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Situation imprévue"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-amber-700 bg-amber-50 p-6 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-amber-900">
          🎲 Situation imprévue
        </h2>

        <p className="text-sm text-amber-950/80">
          Générez un PNJ, un lieu, un événement, une rumeur et une complication
          pour improviser rapidement.
        </p>

        {result && (
          <div className="mt-4 rounded border border-amber-700 bg-amber-100 p-4">
            <p>
              <strong>PNJ :</strong> {result.npc}
            </p>
            <p>
              <strong>Lieu :</strong> {result.location}
            </p>
            <p>
              <strong>Événement :</strong> {result.event}
            </p>
            <p>
              <strong>Rumeur :</strong> {result.rumor}
            </p>
            <p>
              <strong>Complication :</strong> {result.complication}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded border border-amber-700 bg-amber-100 px-4 py-2 font-semibold text-amber-900 shadow transition hover:bg-amber-200"
            onClick={() => setResult(generateImprovisation())}
          >
            Générer
          </button>
          <button
            type="button"
            className="rounded border border-amber-700 bg-amber-50 px-4 py-2 font-semibold text-amber-900 shadow transition hover:bg-amber-100"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

