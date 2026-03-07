import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export function NpcListPage() {
  const { data, createNpc, deleteNpc } = useAppData();
  const navigate = useNavigate();

  const countAppearances = (npcId: string): number => {
    let count = 0;
    for (const session of data.sessions) {
      for (const scene of session.scenes) {
        if (scene.linkedNpcIds.includes(npcId)) {
          count += 1;
        }
      }
    }
    return count;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">PNJ</h2>
          <p className="page-subtitle">
            Suivez les alliés, mécènes et menaces notables.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const npcId = createNpc();
            navigate(`/npcs/${npcId}`);
          }}
          className="btn-gold-medieval"
        >
          Nouveau PNJ
        </button>
      </div>

      <ul className="space-y-3">
        {data.npcs.map((npc) => (
          <li
            key={npc.id}
            className="item-card"
            style={{ marginBottom: "0.75rem" }}
          >
            <Link to={`/npcs/${npc.id}`} className="block">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      color: "#1e1005",
                      fontWeight: "600",
                    }}
                  >
                    {npc.name || "PNJ sans nom"}
                  </h3>
                  <p className="text-sm text-amber-950/80">
                    {npc.role || "Aucun rôle défini."}
                  </p>
                  <p className="text-xs text-amber-900/70">
                    Apparitions : {countAppearances(npc.id)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      navigate(`/npcs/${npc.id}`);
                    }}
                    className="btn-gold-medieval"
                  >
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const confirmed = window.confirm("Supprimer ce PNJ ?");
                      if (confirmed) {
                        deleteNpc(npc.id);
                      }
                    }}
                    className="btn-danger-medieval"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {data.npcs.length === 0 && (
          <li className="card card-dashed card-compact text-sm text-amber-950/70">
            Aucun PNJ pour le moment.
          </li>
        )}
      </ul>
    </section>
  );
}
