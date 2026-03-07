import { useMemo } from "react";
import { useAppData } from "../state/AppDataContext";

export function CampaignDashboardPage() {
  const { data, updateCampaign, moveSessionTimeline } = useAppData();

  const orderedItems = useMemo(
    () =>
      data.sessions
        .filter((session) => session.inTimeline)
        .sort((a, b) => a.timelineOrder - b.timelineOrder),
    [data.sessions],
  );

  return (
    <section
      className="space-y-6 p-6"
      style={{
        background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
        border: "2px solid #8b5e2a",
        borderRadius: "2px 12px 2px 12px",
        boxShadow: "4px 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "'Uncial Antiqua', serif", color: "#1e1005" }}>
            Tableau de bord de la campagne
          </h2>
          <p className="text-sm text-amber-950/80" style={{ fontFamily: "'Crimson Text', serif", color: "#7a5c2a", fontStyle: "italic" }}>
            Modifiez l&apos;identité de la campagne et suivez les points clés de
            la chronologie.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium" style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a5c2a" }}>Titre</span>
          <input
            value={data.campaign.title}
            onChange={(event) => updateCampaign({ title: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium" style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a5c2a" }}>Tonalité</span>
          <input
            value={data.campaign.tone}
            onChange={(event) => updateCampaign({ tone: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium" style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7a5c2a" }}>Résumé</span>
        <textarea
          rows={4}
          value={data.campaign.summary}
          onChange={(event) => updateCampaign({ summary: event.target.value })}
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <div className="card card-compact space-y-3">
        <h3
          className="text-lg font-semibold"
          style={{
            fontFamily: "'Uncial Antiqua', serif",
            color: "#1e1005",
            borderBottom: "2px solid #8b5e2a",
            paddingBottom: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          Chronologie
        </h3>

        <ul className="space-y-2">
          {orderedItems.map((session, index) => (
            <li
              key={session.id}
              className="card card-compact flex items-center gap-2"
              style={{
                background: "#faf3e0",
                border: "1px solid #c9962a",
                borderRadius: "2px 8px 2px 8px",
                padding: "0.75rem 1rem",
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <span className="w-8 text-center text-sm text-amber-950/70">
                {session.timelineOrder}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {session.title || "Session sans titre"}
                </p>
                <p className="text-xs text-amber-950/70">
                  {session.objective || "Aucun objectif pour le moment."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveSessionTimeline(session.id, "up")}
                  disabled={index === 0}
                  className="px-3 py-1 text-sm"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: "transparent",
                    color: "#8a6010",
                    border: "1px solid #8a6010",
                    borderRadius: "2px 6px 2px 6px",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  Monter
                </button>
                <button
                  type="button"
                  onClick={() => moveSessionTimeline(session.id, "down")}
                  disabled={index === orderedItems.length - 1}
                  className="px-3 py-1 text-sm"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: "transparent",
                    color: "#8a6010",
                    border: "1px solid #8a6010",
                    borderRadius: "2px 6px 2px 6px",
                    cursor: "pointer",
                    letterSpacing: "0.06em",
                  }}
                >
                  Descendre
                </button>
              </div>
            </li>
          ))}
          {orderedItems.length === 0 && (
            <li className="card card-dashed card-compact text-sm text-amber-950/70">
              Aucune session dans la chronologie pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
