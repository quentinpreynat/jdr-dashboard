import { Link, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, updateSession, addScene, updateScene, deleteScene, moveScene, setSceneNpcLink } =
    useAppData();
  const session = data.sessions.find((entry) => entry.id === sessionId);

  if (!session || !sessionId) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Session introuvable</h2>
        <Link to="/sessions" className="text-oak underline">
          Retour aux sessions
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Détails de la session</h2>
        <button
          type="button"
          onClick={() => addScene(sessionId)}
          className="min-h-11 rounded-md bg-moss px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Ajouter une scène
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Titre</span>
          <input
            value={session.title}
            onChange={(event) => updateSession(sessionId, { title: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Objectif</span>
          <input
            value={session.objective}
            onChange={(event) => updateSession(sessionId, { objective: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Notes du MJ</span>
        <textarea
          rows={5}
          value={session.notes}
          onChange={(event) => updateSession(sessionId, { notes: event.target.value })}
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <div className="space-y-3 rounded-md border border-amber-900/20 p-3">
        <h3 className="text-lg font-semibold">Scènes</h3>
        <ul className="space-y-3">
          {[...session.scenes]
            .sort((a, b) => a.order - b.order)
            .map((scene, index, orderedScenes) => (
              <li key={scene.id} className="rounded-md border border-amber-900/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-amber-950/70">Scène {scene.order}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveScene(sessionId, scene.id, "up")}
                      disabled={index === 0}
                      className="min-h-11 rounded-md border border-amber-900/20 px-2 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Monter
                    </button>
                    <button
                      type="button"
                      onClick={() => moveScene(sessionId, scene.id, "down")}
                      disabled={index === orderedScenes.length - 1}
                      className="min-h-11 rounded-md border border-amber-900/20 px-2 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Descendre
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteScene(sessionId, scene.id)}
                      className="min-h-11 rounded-md border border-red-900/20 px-3 py-2 text-sm text-red-900 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <label className="mb-2 flex flex-col gap-1">
                  <span className="text-sm font-medium">Titre</span>
                  <input
                    value={scene.title}
                    onChange={(event) => updateScene(sessionId, scene.id, { title: event.target.value })}
                    className="rounded-md border border-amber-900/20 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Texte</span>
                  <textarea
                    rows={4}
                    value={scene.text}
                    onChange={(event) => updateScene(sessionId, scene.id, { text: event.target.value })}
                    className="rounded-md border border-amber-900/20 px-3 py-2"
                  />
                </label>
                <div className="mt-3 rounded-md border border-amber-900/20 p-2">
                  <p className="text-xs font-medium text-amber-900">PNJ liés</p>
                  <div className="mt-2 space-y-2">
                    {data.npcs.map((npc) => {
                      const isLinked = scene.linkedNpcIds.includes(npc.id);
                      return (
                        <label
                          key={npc.id}
                          className="flex min-h-11 items-center gap-2 rounded-md border border-amber-900/20 p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={(event) =>
                              setSceneNpcLink(session.id, scene.id, npc.id, event.target.checked)
                            }
                            className="h-4 w-4 accent-amber-900"
                          />
                          <span className="font-medium">{npc.name || "PNJ sans nom"}</span>
                          <span className="text-amber-900/70">{npc.role || "Aucun rôle"}</span>
                        </label>
                      );
                    })}
                    {data.npcs.length === 0 && (
                      <p className="text-sm text-amber-950/70">Aucun PNJ disponible pour le moment.</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          {session.scenes.length === 0 && (
            <li className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
              Aucune scène pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
