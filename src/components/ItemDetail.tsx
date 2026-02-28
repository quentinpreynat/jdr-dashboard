import type { Npc, Place } from "../models";
import type { Item } from "../types/item";

interface ItemDetailProps {
  item: Item;
  npcs: Npc[];
  places: Place[];
  onOpenNpc?(npcId: string): void;
  onOpenPlace?(placeId: string): void;
}

export function ItemDetail({
  item,
  npcs,
  places,
  onOpenNpc,
  onOpenPlace,
}: ItemDetailProps) {
  const linkedNpcIds = item.linkedNpcIds ?? [];
  const linkedPlaceIds = item.linkedPlaceIds ?? [];
  const linkedNpcs = npcs.filter((npc) => linkedNpcIds.includes(npc.id));
  const linkedPlaces = places.filter((place) => linkedPlaceIds.includes(place.id));

  return (
    <article className="rounded-md border border-stone-300 bg-gradient-to-b from-stone-100 to-stone-200 p-4 shadow-sm text-stone-800">
      <h4 className="font-serif text-lg font-semibold tracking-wide text-stone-900">
        {item.name?.trim() || "Objet sans nom"}
      </h4>

      {item.description?.trim() && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
          {item.description}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
            PNJ liés
          </p>
          {linkedNpcs.length > 0 ? (
            <ul className="space-y-2">
              {linkedNpcs.map((npc) => (
                <li key={npc.id}>
                  <button
                    type="button"
                    onClick={
                      onOpenNpc ? () => onOpenNpc(npc.id) : undefined
                    }
                    className={`w-full rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-left text-sm text-stone-900 transition-colors duration-200 hover:bg-stone-200/60 ${
                      onOpenNpc ? "" : "cursor-default"
                    }`}
                    disabled={!onOpenNpc}
                  >
                    <p className="font-medium">{npc.name || "PNJ sans nom"}</p>
                    {npc.role && (
                      <p className="text-xs text-stone-600">{npc.role}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-700">Aucun PNJ lié.</p>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
            Lieux liés
          </p>
          {linkedPlaces.length > 0 ? (
            <ul className="space-y-2">
              {linkedPlaces.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={
                      onOpenPlace ? () => onOpenPlace(place.id) : undefined
                    }
                    className={`w-full rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-left text-sm text-stone-900 transition-colors duration-200 hover:bg-stone-200/60 ${
                      onOpenPlace ? "" : "cursor-default"
                    }`}
                    disabled={!onOpenPlace}
                  >
                    <p className="font-medium">
                      {place.name || "Lieu sans nom"}
                    </p>
                    {place.region && (
                      <p className="text-xs text-stone-600">{place.region}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-700">Aucun lieu lié.</p>
          )}
        </section>

        {item.notes?.trim() && (
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">
              Notes MJ
            </p>
            <p className="whitespace-pre-wrap text-sm text-stone-700">
              {item.notes}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}

