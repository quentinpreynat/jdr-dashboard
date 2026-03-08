import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export function SessionsListPage() {
  const { data, createSession, deleteSession } = useAppData();
  const navigate = useNavigate();

  const formatUpdatedAt = (value: string): string => {
    const date = new Date(value);
    return date.toLocaleString("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
          <h2 className="page-title">Sessions</h2>
          <p className="page-subtitle">Créez et gérez les sessions de jeu.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const sessionId = createSession();
            navigate(`/sessions/${sessionId}`);
          }}
          className="btn-gold-medieval"
        >
          Nouvelle session
        </button>
      </div>

      <ul className="space-y-3">
        {data.sessions.map((session) => (
          <li
            key={session.id}
            className="item-card"
            style={{ marginBottom: "0.75rem" }}
          >
            <Link
              to={`/sessions/${session.id}`}
              className="block"
            >
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
                    {session.title || "Session sans titre"}
                  </h3>
                  <p className="text-sm text-amber-950/80">
                    {session.objective || "Aucun objectif pour le moment."}
                  </p>
                  <p className="page-subtitle" style={{ fontSize: "0.75rem" }}>
                    Mise à jour : {formatUpdatedAt(session.updatedAt)}
                  </p>
                  <p className="page-subtitle" style={{ fontSize: "0.75rem" }}>
                    PNJ liés : {countLinkedNpcs(session.id)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/session/${session.id}/live`}
                    className="btn-gold-medieval"
                  >
                    ⚔️ Session Live
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const confirmed = window.confirm(
                        "Supprimer cette session ?",
                      );
                      if (confirmed) {
                        deleteSession(session.id);
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
        {data.sessions.length === 0 && (
          <li className="card card-dashed card-compact text-sm text-amber-950/70">
            Aucune session pour le moment.
          </li>
        )}
      </ul>
    </section>
  );
}
