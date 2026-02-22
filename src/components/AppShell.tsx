import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppData } from "../state/AppDataContext";

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  `flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-oak text-white" : "text-ink hover:bg-amber-100"
  }`;

export function AppShell() {
  const { data, resetDemoData, lastSavedAt } = useAppData();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const location = useLocation();
  const isLiveMode =
    location.pathname.startsWith("/session/") &&
    location.pathname.endsWith("/live");

  const savedLabel = lastSavedAt
    ? `Enregistré · ${new Date(lastSavedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
    : "Non enregistré";

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const onReset = () => {
    const confirmed = window.confirm(
      "Réinitialiser toutes les données locales avec les valeurs de démo ?",
    );
    if (confirmed) {
      resetDemoData();
    }
  };

  if (isLiveMode) {
    return (
      <div className="min-h-screen w-full text-ink">
        <main className="min-h-screen w-full overflow-x-hidden p-0">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef9e9_0%,#f1ece0_45%,#e8e1d2_100%)] text-ink">
      <header className="border-b border-amber-900/15 bg-parchment/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              L&apos;Anneau Unique - Carnet du MJ
            </h1>
            <p className="text-xs text-amber-950/80">
              Application web locale - jalon 1
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-amber-900/70">
            {!isOnline && (
              <span className="badge badge-hostile px-2 py-1">Hors ligne</span>
            )}
            <span>{savedLabel}</span>
          </div>
          <button type="button" onClick={onReset} className="btn btn-subtle">
            Réinitialiser les données de démo
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 lg:hidden">
          <NavLink to="/" end className={navLinkClass}>
            Campagne
          </NavLink>
          <NavLink to="/sessions" className={navLinkClass}>
            Sessions
          </NavLink>
          <NavLink to="/npcs" className={navLinkClass}>
            PNJ
          </NavLink>
          <NavLink
            to={`/campaign/${data.campaign.id}/places`}
            className={navLinkClass}
          >
            Lieux
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Recherche
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            Paramètres
          </NavLink>
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[220px_1fr]">
        <aside className="card card-solid hidden rounded-lg p-3 shadow-sm lg:block">
          <nav className="flex gap-2 md:flex-col">
            <NavLink to="/" end className={navLinkClass}>
              Campagne
            </NavLink>
            <NavLink to="/sessions" className={navLinkClass}>
              Sessions
            </NavLink>
            <NavLink to="/npcs" className={navLinkClass}>
              PNJ
            </NavLink>
            <NavLink
              to={`/campaign/${data.campaign.id}/places`}
              className={navLinkClass}
            >
              Lieux
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Recherche
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Paramètres
            </NavLink>
          </nav>
        </aside>

        <main className="card card-solid rounded-lg p-4 shadow-sm">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
