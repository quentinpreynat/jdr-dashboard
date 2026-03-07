import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppData } from "../state/AppDataContext";

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive ? "nav-link-active" : "nav-link-inactive";

export function AppShell() {
  const { data, lastSavedAt } = useAppData();
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

  /*
    const confirmed = window.confirm(
      "Réinitialiser toutes les données locales avec les valeurs de démo ?",
    );
    if (confirmed) {
      resetDemoData();
    }
  */

  if (isLiveMode) {
    return (
      <div className="min-h-screen w-full text-stone-800">
        <main className="min-h-screen w-full overflow-x-hidden p-0">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div
      className="text-ink"
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header className="bg-[#2c1a08] shadow-[inset_0_-4px_12px_rgba(0,0,0,0.5)] border-b-2 border-[#c9962a] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ fontFamily: "'Uncial Antiqua', serif", color: "#c9962a" }}
            >
              L&apos;Anneau Unique - Carnet du MJ
            </h1>
            <p
              className="text-sm"
              style={{
                fontFamily: "'Crimson Text', serif",
                color: "#a08040",
                fontStyle: "italic",
              }}
            >
              Application web locale - jalon 1
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {!isOnline && (
              <span className="badge badge-hostile px-2 py-1">Hors ligne</span>
            )}
            <span
              style={{
                color: "#8b6914",
                fontStyle: "italic",
                fontFamily: "'Crimson Text', serif",
              }}
            >
              {savedLabel}
            </span>
          </div>

          {/*
            type="button"
            onClick={onReset}
            className="btn-medieval btn-medieval-outline min-h-11 px-3 py-2 text-sm"
          >
            Réinitialiser les données de démo
          */}
        </div>

        <nav className="mx-auto flex max-w-6xl gap-2 bg-[#f0d9a0] px-4 pb-3 pt-3 lg:hidden border-t border-[#8b5e2a]">
          <NavLink to="/campaigns" className={navLinkClass}>
            Univers
          </NavLink>
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

      <div className="gold-separator">
        <span>✦</span>
      </div>

      <div
        className="app-container mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[220px_1fr] min-h-0"
        style={{ flex: 1, backgroundColor: "transparent" }}
      >
        <aside
          className="hidden lg:block rounded-lg p-3 shadow-sm"
          style={{
            background: "linear-gradient(180deg, #2c1a08 0%, #1a0f02 100%)",
            border: "2px solid #8a6010",
            borderRadius: "2px 10px 2px 10px",
            boxShadow: "3px 3px 14px rgba(0,0,0,0.4)",
          }}
        >
          <p
            style={{
              fontFamily: "'Uncial Antiqua', serif",
              color: "#8a6010",
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.5rem 1rem",
              marginBottom: "0.5rem",
              borderBottom: "1px solid rgba(138,96,16,0.3)",
            }}
          >
            Navigation
          </p>
          <nav className="flex flex-col">
            <NavLink to="/campaigns" className={navLinkClass}>
              🌍 Univers
            </NavLink>
            <NavLink to="/" end className={navLinkClass}>
              📜 Campagne
            </NavLink>
            <NavLink to="/sessions" className={navLinkClass}>
              ⚔️ Sessions
            </NavLink>
            <NavLink to="/npcs" className={navLinkClass}>
              🎭 PNJ
            </NavLink>
            <NavLink
              to={`/campaign/${data.campaign.id}/places`}
              className={navLinkClass}
            >
              🏰 Lieux
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              🔍 Recherche
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              ⚙️ Paramètres
            </NavLink>
          </nav>
        </aside>

        <main
          className="self-start"
          style={{
            background: "transparent",
            border: "none",
            boxShadow: "none",
            padding: "0",
            minHeight: "calc(100vh - 140px)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
