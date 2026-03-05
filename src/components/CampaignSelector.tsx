import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaign } from "../hooks/useCampaign";

function defaultNewCampaignTitle(existingCount: number): string {
  return `Campagne ${existingCount + 1}`;
}

export function CampaignSelector() {
  const { campaigns, currentCampaign, selectCampaign, createCampaign, deleteCampaign } =
    useCampaign();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>("");

  const sorted = useMemo(
    () => [...campaigns].sort((a, b) => b.createdAt - a.createdAt),
    [campaigns],
  );

  const onCreate = () => {
    const trimmed = title.trim();
    const nextTitle = trimmed || defaultNewCampaignTitle(campaigns.length);
    const id = createCampaign(nextTitle);
    setTitle("");
    navigate("/");
    selectCampaign(id);
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Campagnes</h2>
        <p className="text-sm text-amber-950/80">
          Sélectionnez une campagne active ou créez-en une nouvelle.
        </p>
      </div>

      <div className="card card-compact space-y-3">
        <h3 className="text-lg font-semibold">Liste des campagnes</h3>
        <ul className="space-y-2">
          {sorted.map((campaign) => {
            const isActive = currentCampaign?.id === campaign.id;
            return (
              <li key={campaign.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    selectCampaign(campaign.id);
                    navigate("/");
                  }}
                  className={`flex-1 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "border-[#b89a6a] bg-[rgba(217,181,109,0.35)] font-semibold"
                      : "border-[#b89a6a]/70 bg-[rgba(241,229,208,0.75)] hover:bg-[rgba(241,229,208,0.92)]"
                  }`}
                >
                  {campaign.title}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Supprimer la campagne "${campaign.title}" ?`,
                    );
                    if (confirmed) {
                      deleteCampaign(campaign.id);
                      navigate("/");
                    }
                  }}
                  className="btn btn-danger px-3 text-sm"
                  disabled={campaigns.length <= 1}
                  title={
                    campaigns.length <= 1
                      ? "Impossible de supprimer la dernière campagne."
                      : undefined
                  }
                >
                  Supprimer
                </button>
              </li>
            );
          })}
          {sorted.length === 0 && (
            <li className="card card-dashed card-compact text-sm text-amber-950/70">
              Aucune campagne pour le moment.
            </li>
          )}
        </ul>
      </div>

      <div className="card card-compact space-y-3">
        <h3 className="text-lg font-semibold">Nouvelle campagne</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={defaultNewCampaignTitle(campaigns.length)}
            className="min-h-11 flex-1 rounded-xl border border-[#b89a6a]/70 bg-[rgba(241,229,208,0.9)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[rgba(58,46,31,0.65)]"
          />
          <button type="button" onClick={onCreate} className="btn btn-primary">
            Créer
          </button>
        </div>
      </div>
    </section>
  );
}
