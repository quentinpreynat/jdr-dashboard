import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export function SessionsListPage() {
  const { data, createSession, deleteSession } = useAppData();
  const navigate = useNavigate();

  const formatUpdatedAt = (value: string): string => {
    const date = new Date(value);
    return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  };

  const countLinkedNpcs = (sessionId: string): number => {
    const session = data.sessions.find((entry) => entry.id === sessionId);
    if (!session) {
      return 0;
    }

    const ids = session.scenes.flatMap((scene) => scene.linkedNpcIds);
    return new Set(ids).size;
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Sessions</h2>
          <p className="text-sm text-amber-950/80">Créez et gérez les sessions de jeu.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const sessionId = createSession();
            navigate(`/sessions/${sessionId}`);
          }}
          className="btn btn-primary"
        >
          Nouvelle session
        </button>
      </div>

      <ul className="space-y-3">
        {data.sessions.map((session) => (
          <li key={session.id}>
            <Link to={`/sessions/${session.id}`} className="card card-compact block">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{session.title || "Session sans titre"}</h3>
                  <p className="text-sm text-amber-950/80">
                    {session.objective || "Aucun objectif pour le moment."}
                  </p>
                  <p className="text-xs text-amber-900/70">
                    Mise à jour : {formatUpdatedAt(session.updatedAt)}
                  </p>
                  <p className="text-xs text-amber-900/70">
                    PNJ liés : {countLinkedNpcs(session.id)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const confirmed = window.confirm("Supprimer cette session ?");
                      if (confirmed) {
                        deleteSession(session.id);
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </Link>
          </li>
        ))}
        {data.sessions.length === 0 && (
          <li className="card card-dashed card-compact text-sm text-amber-950/70">
            Aucune session pour le moment.
          </li>
        )}
      </ul>
    </section>
  );
}
