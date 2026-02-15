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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">PNJ</h2>
          <p className="text-sm text-amber-950/80">Suivez les alliés, mécènes et menaces notables.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const npcId = createNpc();
            navigate(`/npcs/${npcId}`);
          }}
          className="min-h-11 rounded-md bg-moss px-3 py-2 font-medium text-white hover:opacity-90"
        >
          Nouveau PNJ
        </button>
      </div>

      <ul className="space-y-3">
        {data.npcs.map((npc) => (
          <li key={npc.id} className="rounded-md border border-amber-900/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{npc.name || "PNJ sans nom"}</h3>
                <p className="text-sm text-amber-950/80">{npc.role || "Aucun rôle défini."}</p>
                <p className="text-xs text-amber-900/70">Apparitions : {countAppearances(npc.id)}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/npcs/${npc.id}`}
                  className="min-h-11 rounded-md border border-amber-900/30 px-3 py-2 text-sm hover:bg-amber-100"
                >
                  Ouvrir
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm("Supprimer ce PNJ ?");
                    if (confirmed) {
                      deleteNpc(npc.id);
                    }
                  }}
                  className="min-h-11 rounded-md border border-red-900/20 px-3 py-2 text-sm text-red-900 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </li>
        ))}
        {data.npcs.length === 0 && (
          <li className="rounded-md border border-dashed border-amber-900/20 p-4 text-sm text-amber-950/70">
            Aucun PNJ pour le moment.
          </li>
        )}
      </ul>
    </section>
  );
}
