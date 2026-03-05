import { useEffect, useMemo, useRef, useState } from "react";
import type { ImprovisationResult } from "../../types/improvisation";
import { generateImprovisation } from "../../lib/improvisationGenerator";

export type ImprovisationGeneratorProps = {
  onAddToSession?: (result: ImprovisationResult) => void;
};

type CardItem = {
  key: keyof ImprovisationResult;
  label: string;
  value: string;
};

export function ImprovisationGenerator({
  onAddToSession,
}: ImprovisationGeneratorProps) {
  const [result, setResult] = useState<ImprovisationResult | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [didAdd, setDidAdd] = useState<boolean>(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cards = useMemo<CardItem[] | null>(() => {
    if (!result) return null;
    return [
      { key: "npc", label: "PNJ", value: result.npc },
      { key: "location", label: "Lieu", value: result.location },
      { key: "event", label: "Événement", value: result.event },
      { key: "rumor", label: "Rumeur", value: result.rumor },
      { key: "complication", label: "Complication", value: result.complication },
    ];
  }, [result]);

  const generate = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setDidAdd(false);
    setIsAnimating(true);
    const next = generateImprovisation();
    setResult(next);

    timeoutRef.current = window.setTimeout(() => {
      setIsAnimating(false);
      timeoutRef.current = null;
    }, 220);
  };

  const canAdd = Boolean(result) && Boolean(onAddToSession);

  const onAdd = () => {
    if (!result || !onAddToSession) return;
    onAddToSession(result);
    setDidAdd(true);
  };

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="font-cinzel text-lg font-semibold">
          Générateur d&apos;improvisation
        </h2>
        <p className="text-sm opacity-85">
          Générez rapidement un PNJ, un lieu, un événement, une rumeur et une
          complication pour rebondir en session.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {!result ? (
          <button type="button" onClick={generate} className="btn btn-primary">
            Improviser
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={generate}
              className="btn btn-primary"
            >
              Générer à nouveau
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="btn btn-subtle"
              disabled={!canAdd}
              title={
                canAdd
                  ? "Ajouter ce résultat à la session"
                  : "Fournissez un callback onAddToSession pour activer l'ajout"
              }
            >
              Ajouter à la session
            </button>
            {didAdd && (
              <span className="badge badge-friendly">Ajouté</span>
            )}
          </>
        )}
      </div>

      {cards && (
        <div
          className={`grid gap-3 md:grid-cols-2 ${
            isAnimating ? "opacity-60" : "opacity-100"
          } transition-opacity duration-200`}
        >
          {cards.map((card) => (
            <article key={card.key} className="card card-muted card-compact">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide opacity-75">
                  {card.label}
                </h3>
              </div>
              <p className="mt-2 text-sm">{card.value}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

