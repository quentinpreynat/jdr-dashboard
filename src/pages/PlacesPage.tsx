import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

export function PlacesPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const location = useLocation();
  const { data, addPlace, updatePlace, removePlace } = useAppData();
  const isCampaignMatch = campaignId === data.campaign.id;
  const places = isCampaignMatch ? data.campaign.places ?? [] : [];
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(places[0]?.id ?? null);

  useEffect(() => {
    if (!selectedPlaceId && places[0]) {
      setSelectedPlaceId(places[0].id);
      return;
    }
    if (selectedPlaceId && !places.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId(places[0]?.id ?? null);
    }
  }, [places, selectedPlaceId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const placeId = params.get("place");
    if (placeId && places.some((place) => place.id === placeId)) {
      setSelectedPlaceId(placeId);
      const node = document.getElementById(`place-${placeId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [location.search, places]);

  const selectedPlace = selectedPlaceId
    ? places.find((place) => place.id === selectedPlaceId) ?? null
    : null;

  const linkedScenes = useMemo(() => {
    if (!selectedPlaceId) {
      return [];
    }
    return data.sessions.flatMap((session) =>
      session.scenes
        .filter((scene) => scene.placeId === selectedPlaceId)
        .map((scene) => ({ session, scene }))
    );
  }, [data.sessions, selectedPlaceId]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-900/60">Campagne</p>
          <h2 className="text-2xl font-semibold">Lieux</h2>
          <p className="text-sm text-amber-950/70">Référentiel des lieux de la campagne.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className="btn btn-subtle">
            Retour campagne
          </Link>
          <button
            type="button"
            onClick={() => {
              if (!campaignId) {
                return;
              }
              const placeId = addPlace(campaignId, {
                name: "Nouveau lieu",
                region: "",
                description: ""
              });
              if (placeId) {
                setSelectedPlaceId(placeId);
              }
            }}
            className="btn btn-primary"
          >
            Nouveau lieu
          </button>
        </div>
      </header>

      {!isCampaignMatch && (
        <p className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
          Campagne introuvable.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="card card-compact space-y-3">
          <h3 className="text-lg font-semibold">Liste</h3>
          <div className="space-y-2">
            {places.map((place) => (
              <button
                key={place.id}
                id={`place-${place.id}`}
                type="button"
                onClick={() => setSelectedPlaceId(place.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                  place.id === selectedPlaceId
                    ? "border-amber-900/40 bg-amber-100 text-amber-950"
                    : "border-amber-900/20 bg-white/70 text-amber-950/80 hover:bg-amber-50"
                }`}
              >
                <p className="font-medium">{place.name || "Lieu sans nom"}</p>
                {place.region && <p className="text-xs text-amber-900/70">{place.region}</p>}
              </button>
            ))}
            {places.length === 0 && (
              <p className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
                Aucun lieu pour le moment.
              </p>
            )}
          </div>
        </aside>

        <div className="space-y-4">
          {!selectedPlace && (
            <p className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
              Sélectionnez un lieu pour l&apos;éditer.
            </p>
          )}

          {selectedPlace && (
            <>
              <section className="card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Détails</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm("Supprimer ce lieu ?");
                      if (confirmed) {
                        if (campaignId) {
                          removePlace(campaignId, selectedPlace.id);
                        }
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Nom</span>
                    <input
                      value={selectedPlace.name}
                      onChange={(event) =>
                        campaignId
                          ? updatePlace(campaignId, selectedPlace.id, { name: event.target.value })
                          : undefined
                      }
                      className="rounded-md border border-amber-900/20 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Région</span>
                    <input
                      value={selectedPlace.region ?? ""}
                      onChange={(event) =>
                        campaignId
                          ? updatePlace(campaignId, selectedPlace.id, { region: event.target.value })
                          : undefined
                      }
                      className="rounded-md border border-amber-900/20 px-3 py-2"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    rows={4}
                    value={selectedPlace.description ?? ""}
                    onChange={(event) =>
                      campaignId
                        ? updatePlace(campaignId, selectedPlace.id, { description: event.target.value })
                        : undefined
                    }
                    className="rounded-md border border-amber-900/20 px-3 py-2"
                  />
                </label>
              </section>

              <section className="card space-y-3">
                <h3 className="text-lg font-semibold">Scènes liées</h3>
                <div className="space-y-2">
                  {linkedScenes.map(({ session, scene }) => (
                    <Link
                      key={scene.id}
                      to={`/sessions/${session.id}?scene=${scene.id}`}
                      className="block rounded-md border border-amber-900/20 bg-white/70 px-3 py-2 text-sm hover:bg-amber-50"
                    >
                      <p className="font-medium">{scene.title || `Scène ${scene.order}`}</p>
                      <p className="text-xs text-amber-900/70">{session.title || "Session sans titre"}</p>
                    </Link>
                  ))}
                  {linkedScenes.length === 0 && (
                    <p className="rounded-md border border-dashed border-amber-900/20 p-3 text-sm text-amber-950/70">
                      Aucune scène liée à ce lieu pour le moment.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
