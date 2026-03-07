import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { SceneEditor } from "../components/SceneEditor";
import { useAppData } from "../state/AppDataContext";

export function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const {
    data,
    updateSession,
    addScene,
    updateScene,
    deleteScene,
    setSceneNpcLink,
    addSceneChoice,
    removeSceneChoice,
  } = useAppData();
  const session = data.sessions.find((entry) => entry.id === sessionId);
  const [highlightSceneId, setHighlightSceneId] = useState<string | null>(null);
  const places = data.campaign.places ?? [];

  useEffect(() => {
    if (!session || !sessionId) {
      return;
    }
    const params = new URLSearchParams(location.search);
    const sceneId = params.get("scene");
    if (!sceneId) {
      return;
    }
    setHighlightSceneId(sceneId);
    const target = document.getElementById(`scene-${sceneId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => setHighlightSceneId(null), 1500);
    }
  }, [location.search, session, sessionId]);

  if (!session || !sessionId) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Session introuvable</h2>
        <Link to="/sessions" className="text-stone-700 underline">
          Retour aux sessions
        </Link>
      </section>
    );
  }

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
      <div className="flex items-center justify-between gap-4">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Uncial Antiqua', serif", color: "#1e1005" }}
        >
          Détails de la session
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/session/${sessionId}/live`}
            className="btn-open-session-live"
          >
            Open Session Live
          </Link>
          <button
            type="button"
            onClick={() => addScene(sessionId)}
            className="btn-add-scene"
          >
            Ajouter une scène
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ fontFamily: "'Cinzel', serif", color: "#7a5c2a" }}
          >
            Titre
          </span>
          <input
            value={session.title}
            onChange={(event) =>
              updateSession(sessionId, { title: event.target.value })
            }
            className="parchment-text rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ fontFamily: "'Cinzel', serif", color: "#7a5c2a" }}
          >
            Objectif
          </span>
          <input
            value={session.objective}
            onChange={(event) =>
              updateSession(sessionId, { objective: event.target.value })
            }
            className="parchment-text rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ fontFamily: "'Cinzel', serif", color: "#7a5c2a" }}
        >
          Notes du MJ
        </span>
        <textarea
          rows={5}
          value={session.notes}
          onChange={(event) =>
            updateSession(sessionId, { notes: event.target.value })
          }
          className="parchment-text rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
        />
      </label>

      <div className="space-y-3 rounded-[8px] border-2 border-[#8b5e2a] bg-[#f0d9a0] p-6 shadow-[4px_4px_16px_rgba(0,0,0,0.4)]">
        <h3 className="mb-4 border-b-2 border-[#8b5e2a] pb-2 font-cinzel text-[1.1rem] font-semibold tracking-[0.15em] text-[#2c1a08] uppercase">
          Scènes
        </h3>
        <ul className="space-y-3">
          {session.scenes.map((scene) => (
            <SceneEditor
              key={scene.id}
              scene={scene}
              places={places}
              npcs={data.npcs}
              highlight={highlightSceneId === scene.id}
              onDelete={() => deleteScene(sessionId, scene.id)}
              onUpdate={(fields) => updateScene(sessionId, scene.id, fields)}
              onSetNpcLink={(npcId, linked) =>
                setSceneNpcLink(session.id, scene.id, npcId, linked)
              }
              onAddChoice={(choice) => addSceneChoice(sessionId, scene.id, choice)}
              onRemoveChoice={(choiceId) =>
                removeSceneChoice(sessionId, scene.id, choiceId)
              }
            />
          ))}
          {session.scenes.length === 0 && (
            <li className="card card-dashed card-compact text-sm text-stone-600">
              Aucune scène pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
