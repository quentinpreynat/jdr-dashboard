import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";

type ResultType = "npc" | "session" | "scene";

type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  snippet?: string;
  href: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function makeSnippet(value: string, query: string, maxLength: number = 120): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);
  if (!normalizedValue.includes(normalizedQuery)) {
    return undefined;
  }
  const index = normalizedValue.indexOf(normalizedQuery);
  const start = Math.max(0, index - 30);
  const end = Math.min(value.length, index + query.length + 60);
  const slice = value.slice(start, end).trim();
  if (slice.length <= maxLength) {
    return slice;
  }
  return `${slice.slice(0, maxLength)}…`;
}

export function SearchPage() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return [] as SearchResult[];
    }
    const normalizedQuery = normalizeText(trimmed);

    const npcResults: SearchResult[] = data.npcs
      .filter((npc) => {
        const haystack = [
          npc.name,
          npc.role,
          npc.locationText,
          npc.description,
          npc.notes
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((npc) => ({
        id: npc.id,
        type: "npc",
        title: npc.name || "PNJ sans nom",
        subtitle: npc.role || "Aucun rôle",
        snippet:
          makeSnippet(npc.description, trimmed) ??
          makeSnippet(npc.notes, trimmed) ??
          makeSnippet(npc.locationText, trimmed),
        href: `/npcs/${npc.id}`
      }));

    const sessionResults: SearchResult[] = data.sessions
      .filter((session) => {
        const haystack = [session.title, session.objective, session.notes].filter(Boolean).join(" ");
        return normalizeText(haystack).includes(normalizedQuery);
      })
      .map((session) => ({
        id: session.id,
        type: "session",
        title: session.title || "Session sans titre",
        subtitle: session.objective || "Aucun objectif",
        snippet: makeSnippet(session.notes, trimmed) ?? makeSnippet(session.objective, trimmed),
        href: `/sessions/${session.id}`
      }));

    const sceneResults: SearchResult[] = data.sessions.flatMap((session) =>
      session.scenes
        .filter((scene) => {
          const haystack = [scene.title, scene.text].filter(Boolean).join(" ");
          return normalizeText(haystack).includes(normalizedQuery);
        })
        .map((scene) => ({
          id: scene.id,
          type: "scene",
          title: scene.title || `Scène ${scene.order}`,
          subtitle: session.title || "Session sans titre",
          snippet: makeSnippet(scene.text, trimmed),
          href: `/sessions/${session.id}?scene=${scene.id}`
        }))
    );

    return [...npcResults, ...sessionResults, ...sceneResults];
  }, [data, query]);

  const grouped = useMemo(() => {
    const groups: Record<ResultType, SearchResult[]> = { npc: [], session: [], scene: [] };
    for (const result of results) {
      groups[result.type].push(result);
    }
    return groups;
  }, [results]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Recherche</h2>
        <p className="text-sm text-amber-950/70">PNJ, sessions et scènes.</p>
      </div>

      <div className="rounded-md border border-amber-900/20 bg-amber-50/60 p-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Rechercher</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tapez un nom, un lieu, une scène..."
            className="min-h-11 rounded-md border border-amber-900/20 bg-white/80 px-3 py-2 text-base"
          />
        </label>
      </div>

      {query.trim() === "" && (
        <p className="text-sm text-amber-950/70">Saisissez une recherche pour afficher les résultats.</p>
      )}

      {query.trim() !== "" && results.length === 0 && (
        <p className="text-sm text-amber-950/70">Aucun résultat trouvé.</p>
      )}

      {grouped.npc.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">PNJ</h3>
          <ul className="space-y-2">
            {grouped.npc.map((result) => (
              <li key={result.id} className="rounded-md border border-amber-900/20 bg-white/70 p-3">
                <Link to={result.href} className="block">
                  <p className="font-medium">{result.title}</p>
                  {result.subtitle && <p className="text-xs text-amber-900/70">{result.subtitle}</p>}
                  {result.snippet && <p className="mt-1 text-sm text-amber-950/80">{result.snippet}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grouped.session.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Sessions</h3>
          <ul className="space-y-2">
            {grouped.session.map((result) => (
              <li key={result.id} className="rounded-md border border-amber-900/20 bg-white/70 p-3">
                <Link to={result.href} className="block">
                  <p className="font-medium">{result.title}</p>
                  {result.subtitle && <p className="text-xs text-amber-900/70">{result.subtitle}</p>}
                  {result.snippet && <p className="mt-1 text-sm text-amber-950/80">{result.snippet}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grouped.scene.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Scènes</h3>
          <ul className="space-y-2">
            {grouped.scene.map((result) => (
              <li key={result.id} className="rounded-md border border-amber-900/20 bg-white/70 p-3">
                <Link to={result.href} className="block">
                  <p className="font-medium">{result.title}</p>
                  {result.subtitle && <p className="text-xs text-amber-900/70">{result.subtitle}</p>}
                  {result.snippet && <p className="mt-1 text-sm text-amber-950/80">{result.snippet}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
