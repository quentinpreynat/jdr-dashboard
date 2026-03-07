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
    <section
      className="space-y-6 p-6"
      style={{
        background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
        border: "2px solid #8b5e2a",
        borderRadius: "2px 12px 2px 12px",
        boxShadow: "4px 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div>
        <h2 className="page-title">Univers</h2>
        <p className="page-subtitle">
          Sélectionnez un univers actif ou créez-en un nouveau.
        </p>
      </div>

      <div className="section-card space-y-3">
        <h3 className="section-card-title">Liste des campagnes</h3>
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
                  className={
                    isActive
                      ? "item-card-active flex-1 text-left text-sm"
                      : "item-card flex-1 text-left text-sm"
                  }
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
                  className="btn-danger-medieval px-3 text-sm"
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

      <div className="section-card space-y-3">
        <h3 className="section-card-title">Nouvelle campagne</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={defaultNewCampaignTitle(campaigns.length)}
            className="min-h-11 flex-1 rounded-xl px-3 py-2 text-sm"
            style={{
              background: "#fdf6e3",
              border: "1px solid #8b5e2a",
              borderRadius: "2px 8px 2px 8px",
              color: "#1e1005",
            }}
          />
          <button type="button" onClick={onCreate} className="btn-gold-medieval">
            Créer
          </button>
        </div>
      </div>
    </section>
  );
}
