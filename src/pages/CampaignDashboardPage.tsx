import { useMemo } from "react";
import { useAppData } from "../state/AppDataContext";

export function CampaignDashboardPage() {
  const { data, updateCampaign, moveSessionTimeline } = useAppData();

  const orderedItems = useMemo(
    () =>
      data.sessions
        .filter((session) => session.inTimeline)
        .sort((a, b) => a.timelineOrder - b.timelineOrder),
    [data.sessions]
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tableau de bord de la campagne</h2>
        <p className="text-sm text-amber-950/80">
          Modifiez l'identité de la campagne et suivez les points clés de la chronologie.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Titre</span>
          <input
            value={data.campaign.title}
            onChange={(event) => updateCampaign({ title: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Tonalité</span>
          <input
            value={data.campaign.tone}
            onChange={(event) => updateCampaign({ tone: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Résumé</span>
        <textarea
          rows={4}
          value={data.campaign.summary}
          onChange={(event) => updateCampaign({ summary: event.target.value })}
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <div className="space-y-3 rounded-md border border-amber-900/20 p-3">
        <h3 className="text-lg font-semibold">Chronologie</h3>

        <ul className="space-y-2">
          {orderedItems.map((session, index) => (
            <li key={session.id} className="flex items-center gap-2 rounded-md border border-amber-900/20 p-2">
              <span className="w-8 text-center text-sm text-amber-950/70">{session.timelineOrder}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{session.title || "Session sans titre"}</p>
                <p className="text-xs text-amber-950/70">
                  {session.objective || "Aucun objectif pour le moment."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveSessionTimeline(session.id, "up")}
                  disabled={index === 0}
                  className="min-h-11 rounded-md border border-amber-900/20 px-2 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Monter
                </button>
                <button
                  type="button"
                  onClick={() => moveSessionTimeline(session.id, "down")}
                  disabled={index === orderedItems.length - 1}
                  className="min-h-11 rounded-md border border-amber-900/20 px-2 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Descendre
                </button>
              </div>
            </li>
          ))}
          {orderedItems.length === 0 && (
            <li className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
              Aucune session dans la chronologie pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
