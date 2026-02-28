import type { Npc, Place } from "../models";
import type { Item } from "../types/item";
import { SceneEditorAccordion } from "./SceneEditorAccordion";

interface ItemEditorProps {
  item: Item;
  npcs: Npc[];
  places: Place[];
  onUpdate(fields: Partial<Omit<Item, "id">>): void;
}

function toggleId(list: string[], id: string, linked: boolean): string[] {
  const next = new Set(list);
  if (linked) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return Array.from(next);
}

export function ItemEditor({ item, npcs, places, onUpdate }: ItemEditorProps) {
  const linkedNpcIds = item.linkedNpcIds ?? [];
  const linkedPlaceIds = item.linkedPlaceIds ?? [];

  return (
    <section className="space-y-2">
      <SceneEditorAccordion title="Identité" defaultOpen>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-800">Nom</span>
          <input
            value={item.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            className="parchment-text min-h-11 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            placeholder="Nom de l'objet..."
          />
        </label>
      </SceneEditorAccordion>

      <SceneEditorAccordion title="Description" defaultOpen>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-800">
            Description
          </span>
          <textarea
            rows={6}
            value={item.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            className="parchment-text min-h-40 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            placeholder="Description..."
          />
        </label>
      </SceneEditorAccordion>

      <SceneEditorAccordion title={`PNJ liés (${linkedNpcIds.length})`}>
        <div className="space-y-2">
          {npcs.map((npc) => {
            const isLinked = linkedNpcIds.includes(npc.id);
            return (
              <label
                key={npc.id}
                className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 bg-stone-100/80 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={isLinked}
                  onChange={(event) =>
                    onUpdate({
                      linkedNpcIds: toggleId(
                        linkedNpcIds,
                        npc.id,
                        event.target.checked,
                      ),
                    })
                  }
                  className="h-4 w-4 accent-stone-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-800">
                    {npc.name || "PNJ sans nom"}
                  </span>
                  <span className="block truncate text-xs text-stone-600">
                    {npc.role || "Aucun rôle"}
                  </span>
                </span>
              </label>
            );
          })}
          {npcs.length === 0 && (
            <p className="text-sm text-stone-600">
              Aucun PNJ disponible pour le moment.
            </p>
          )}
        </div>
      </SceneEditorAccordion>

      <SceneEditorAccordion title={`Lieux liés (${linkedPlaceIds.length})`}>
        <div className="space-y-2">
          {places.map((place) => {
            const isLinked = linkedPlaceIds.includes(place.id);
            return (
              <label
                key={place.id}
                className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 bg-stone-100/80 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={isLinked}
                  onChange={(event) =>
                    onUpdate({
                      linkedPlaceIds: toggleId(
                        linkedPlaceIds,
                        place.id,
                        event.target.checked,
                      ),
                    })
                  }
                  className="h-4 w-4 accent-stone-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-800">
                    {place.name || "Lieu sans nom"}
                  </span>
                  <span className="block truncate text-xs text-stone-600">
                    {place.region || "Lieu de campagne"}
                  </span>
                </span>
              </label>
            );
          })}
          {places.length === 0 && (
            <p className="text-sm text-stone-600">Aucun lieu disponible.</p>
          )}
        </div>
      </SceneEditorAccordion>

      <SceneEditorAccordion title="Notes MJ">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-stone-800">Notes</span>
          <textarea
            rows={6}
            value={item.notes ?? ""}
            onChange={(event) => onUpdate({ notes: event.target.value })}
            className="parchment-text min-h-40 rounded-md border border-stone-300 bg-stone-100 px-3 py-2 text-stone-800"
            placeholder="Notes du MJ..."
          />
        </label>
      </SceneEditorAccordion>
    </section>
  );
}

