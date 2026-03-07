import { Link, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import type { NpcAttitude } from "../models";

export function NpcDetailPage() {
  const { npcId } = useParams<{ npcId: string }>();
  const { data, updateNpc } = useAppData();
  const npc = data.npcs.find((entry) => entry.id === npcId);

  const attitudeLabels: Record<NpcAttitude, string> = {
    friendly: "Amical",
    neutral: "Neutre",
    wary: "Méfiant",
    hostile: "Hostile",
  };

  const attitudeClasses: Record<NpcAttitude, string> = {
    friendly: "badge badge-friendly",
    neutral: "badge badge-neutral",
    wary: "badge badge-wary",
    hostile: "badge badge-hostile",
  };

  if (!npc || !npcId) {
    return (
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">PNJ introuvable</h2>
        <Link to="/npcs" className="text-oak underline">
          Retour à la liste des PNJ
        </Link>
      </section>
    );
  }

  const appearances = data.sessions.flatMap((session) =>
    session.scenes
      .filter((scene) => scene.linkedNpcIds.includes(npc.id))
      .map((scene) => ({ session, scene })),
  );

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
      <div className="flex items-center gap-2">
        <h2 className="page-title">Détails du PNJ</h2>
        <span className={`${attitudeClasses[npc.attitude]} px-2 py-1`}>
          {attitudeLabels[npc.attitude]}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">Nom</span>
          <input
            value={npc.name}
            onChange={(event) => updateNpc(npcId, { name: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">Rôle</span>
          <input
            value={npc.role}
            onChange={(event) => updateNpc(npcId, { role: event.target.value })}
            className="rounded-md border border-amber-900/20 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="field-label">Attitude</span>
        <select
          value={npc.attitude}
          onChange={(event) =>
            updateNpc(npcId, { attitude: event.target.value as NpcAttitude })
          }
          className="rounded-md border border-amber-900/20 px-3 py-2"
        >
          <option value="friendly">Amical</option>
          <option value="neutral">Neutre</option>
          <option value="wary">Méfiant</option>
          <option value="hostile">Hostile</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">Lieu</span>
        <input
          value={npc.locationText}
          onChange={(event) =>
            updateNpc(npcId, { locationText: event.target.value })
          }
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">Description</span>
        <textarea
          rows={5}
          value={npc.description}
          onChange={(event) =>
            updateNpc(npcId, { description: event.target.value })
          }
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">Notes du MJ</span>
        <textarea
          rows={5}
          value={npc.notes}
          onChange={(event) => updateNpc(npcId, { notes: event.target.value })}
          className="rounded-md border border-amber-900/20 px-3 py-2"
        />
      </label>

      <div className="section-card">
        <h3 className="section-card-title">Apparitions</h3>
        <p className="text-sm text-amber-950/80">Lecture seule.</p>
        <div className="mt-3 space-y-2">
          {appearances.map(({ session, scene }) => (
            <Link
              key={scene.id}
              to={`/sessions/${session.id}`}
              className="item-card block text-sm"
              style={{ color: "#7a1a1a", textDecoration: "none" }}
            >
              {session.title || "Session sans titre"} —{" "}
              {scene.title || "Scène sans titre"}
            </Link>
          ))}
          {appearances.length === 0 && (
            <p className="text-sm text-amber-950/70">
              Aucune apparition pour le moment.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
