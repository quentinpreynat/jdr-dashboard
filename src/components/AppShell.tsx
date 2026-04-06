import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppData } from "../state/AppDataContext";

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive ? "nav-link-active" : "nav-link-inactive";

function CandleFlame() {
  return (
    <svg width="14" height="24" viewBox="0 0 14 24" style={{ display: "inline-block" }}>
      <rect x="4" y="19" width="6" height="5" rx="1" fill="#d4b87a" />
      <line x1="7" y1="19" x2="7" y2="17" stroke="#2a1a08" strokeWidth="1" />
      <ellipse cx="7" cy="10" rx="4.5" ry="7.5" fill="rgba(255,140,20,0.55)"
        style={{ animation: "flicker 1.8s ease-in-out infinite" }} />
      <ellipse cx="7" cy="12" rx="2.5" ry="5" fill="rgba(255,210,60,0.85)"
        style={{ animation: "flicker 1.3s ease-in-out infinite reverse" }} />
      <ellipse cx="7" cy="13.5" rx="1.2" ry="2.8" fill="rgba(255,250,200,0.95)" />
    </svg>
  );
}

export function AppShell() {
  const { data, lastSavedAt } = useAppData();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const location = useLocation();
  const isLiveMode =
    location.pathname.startsWith("/session/") &&
    location.pathname.endsWith("/live");

  const savedLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

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
    <>
      <style>{`
        @keyframes flicker {
          0%   { transform: scaleY(1) rotate(-1deg) translateX(0px); opacity: 1; }
          20%  { transform: scaleY(0.93) rotate(2deg) translateX(1px); opacity: 0.9; }
          40%  { transform: scaleY(1.05) rotate(-1.5deg) translateX(-1px); opacity: 1; }
          60%  { transform: scaleY(0.96) rotate(1deg) translateX(0.5px); opacity: 0.95; }
          80%  { transform: scaleY(1.02) rotate(-0.5deg) translateX(-0.5px); opacity: 0.98; }
          100% { transform: scaleY(1) rotate(-1deg) translateX(0px); opacity: 1; }
        }
        @keyframes ember-pulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 4px #4ade80; }
          50% { opacity: 1; box-shadow: 0 0 8px #4ade80; }
        }
        .app-header-bg {
          background:
            radial-gradient(ellipse at 15% 0%, rgba(201,150,42,0.14) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 0%, rgba(180,100,20,0.10) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 100%, rgba(120,50,10,0.18) 0%, transparent 60%),
            linear-gradient(180deg, #140a02 0%, #241408 50%, #1a0f05 100%);
        }
        .wood-sidebar {
          background:
            repeating-linear-gradient(172deg,
              transparent 0px, transparent 28px,
              rgba(0,0,0,0.05) 28px, rgba(0,0,0,0.05) 29px),
            repeating-linear-gradient(90deg,
              transparent 0px, transparent 50px,
              rgba(201,150,42,0.015) 50px, rgba(201,150,42,0.015) 51px),
            linear-gradient(180deg, #231205 0%, #1a0e04 35%, #110902 100%);
        }
        .nav-ember:hover {
          background: radial-gradient(ellipse at 0% 50%, rgba(201,150,42,0.2) 0%, transparent 65%),
                      rgba(201,150,42,0.07);
          border-left-color: rgba(201,150,42,0.5) !important;
        }
        .ornament-divider {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0.5rem 0.75rem;
        }
        .ornament-divider::before,
        .ornament-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(138,96,16,0.45), transparent);
        }
        .ornament-divider span {
          color: rgba(138,96,16,0.5);
          font-size: 0.5rem;
        }
        .candle-group {
          filter: drop-shadow(0 0 5px rgba(255,150,20,0.45)) drop-shadow(0 0 10px rgba(255,100,0,0.2));
        }
        .header-title {
          text-shadow: 0 0 18px rgba(201,150,42,0.35), 0 2px 6px rgba(0,0,0,0.9);
        }
        .saved-indicator {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ade80;
          animation: ember-pulse 2.5s ease-in-out infinite;
          display: inline-block;
        }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "transparent", display: "flex", flexDirection: "column" }}>

        {/* ═══════════════════ HEADER ═══════════════════ */}
        <header
          className="app-header-bg"
          style={{
            borderBottom: "1px solid rgba(201,150,42,0.25)",
            boxShadow: "0 6px 30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(201,150,42,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ligne dorée décorative */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #8a6010 15%, #c9962a 35%, #f0c060 50%, #c9962a 65%, #8a6010 85%, transparent 100%)",
          }} />

          {/* Halo chaud en bas */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "40px",
            background: "linear-gradient(0deg, rgba(120,50,8,0.12) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            {/* Titre + bougies */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className="candle-group hidden sm:flex items-end gap-2.5">
                <CandleFlame />
                <div style={{ marginBottom: "3px" }}><CandleFlame /></div>
                <CandleFlame />
              </div>

              <div>
                <h1
                  className="header-title"
                  style={{
                    fontFamily: "'Uncial Antiqua', serif",
                    color: "#f0c060",
                    fontSize: "1.35rem",
                    lineHeight: 1.15,
                    letterSpacing: "0.02em",
                    margin: 0,
                  }}
                >
                  Carnet du Maître du Jeu
                </h1>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  color: "#8a6428",
                  fontStyle: "italic",
                  fontSize: "0.78rem",
                  marginTop: "2px",
                  letterSpacing: "0.06em",
                }}>
                  ✦ &nbsp;Que l'aventure commence&nbsp; ✦
                </p>
              </div>
            </div>

            {/* Statut */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {!isOnline && (
                <span style={{
                  fontFamily: "'Cinzel', serif", fontSize: "0.6rem",
                  color: "#f87171", border: "1px solid rgba(248,113,113,0.3)",
                  padding: "2px 8px", borderRadius: "3px",
                  background: "rgba(122,26,26,0.25)", letterSpacing: "0.12em",
                }}>
                  HORS LIGNE
                </span>
              )}
              {savedLabel && (
                <div style={{
                  fontFamily: "'Crimson Text', serif",
                  color: "rgba(138,100,40,0.8)", fontSize: "0.72rem",
                  fontStyle: "italic", display: "flex", alignItems: "center", gap: "5px",
                }}>
                  <span className="saved-indicator" />
                  Enregistré · {savedLabel}
                </div>
              )}
            </div>
          </div>

          {/* Nav mobile */}
          <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-2 pt-1 lg:hidden overflow-x-auto"
            style={{ borderTop: "1px solid rgba(138,96,16,0.2)" }}>
            <NavLink to="/campaigns" className={navLinkClass}>Univers</NavLink>
            <NavLink to="/" end className={navLinkClass}>Campagne</NavLink>
            <NavLink to="/sessions" className={navLinkClass}>Sessions</NavLink>
            <NavLink to="/characters" className={navLinkClass}>PJ</NavLink>
            <NavLink to="/npcs" className={navLinkClass}>PNJ</NavLink>
            <NavLink to={`/campaign/${data.campaign.id}/places`} className={navLinkClass}>Lieux</NavLink>
            <NavLink to="/search" className={navLinkClass}>Recherche</NavLink>
            <NavLink to="/settings" className={navLinkClass}>Paramètres</NavLink>
          </nav>
        </header>

        {/* Séparateur doré */}
        <div className="gold-separator"><span>✦</span></div>

        {/* ═══════════════════ LAYOUT ═══════════════════ */}
        <div
          className="app-container mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[220px_1fr] min-h-0"
          style={{ flex: 1, backgroundColor: "transparent" }}
        >
          {/* ═══════════════════ SIDEBAR ═══════════════════ */}
          <aside
            className="wood-sidebar hidden lg:flex flex-col rounded-lg overflow-hidden"
            style={{
              border: "1px solid rgba(138,96,16,0.35)",
              borderRadius: "2px 10px 2px 10px",
              boxShadow: "4px 4px 22px rgba(0,0,0,0.55), inset 1px 0 0 rgba(201,150,42,0.04)",
            }}
          >
            {/* Cap du menu */}
            <div style={{
              padding: "0.8rem 1rem 0.55rem",
              borderBottom: "1px solid rgba(138,96,16,0.2)",
              background: "rgba(0,0,0,0.25)",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: "#6a4c18",
                fontSize: "0.58rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}>
                ✦ Navigation ✦
              </p>
            </div>

            {/* Liens */}
            <nav className="flex flex-col px-2 pt-2.5 pb-2 flex-1">

              {/* Groupe principal */}
              {[
                { to: "/campaigns", icon: "🌍", label: "Univers", end: false },
                { to: "/",          icon: "📜", label: "Campagne", end: true },
                { to: "/sessions",  icon: "⚔️", label: "Sessions", end: false },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-ember flex items-center gap-2.5 rounded px-3 py-2 mb-0.5 border-l-2 transition-all duration-150 ${
                      isActive ? "nav-link-active border-[#c9962a]" : "nav-link-inactive border-transparent"
                    }`
                  }
                >
                  <span style={{ fontSize: "0.95rem", minWidth: "18px", textAlign: "center" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}

              <div className="ornament-divider"><span>◆</span></div>

              {/* Groupe personnages */}
              {[
                { to: "/characters", icon: "🧝", label: "PJ" },
                { to: "/npcs",       icon: "🎭", label: "PNJ" },
                { to: `/campaign/${data.campaign.id}/places`, icon: "🏰", label: "Lieux" },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-ember flex items-center gap-2.5 rounded px-3 py-2 mb-0.5 border-l-2 transition-all duration-150 ${
                      isActive ? "nav-link-active border-[#c9962a]" : "nav-link-inactive border-transparent"
                    }`
                  }
                >
                  <span style={{ fontSize: "0.95rem", minWidth: "18px", textAlign: "center" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}

              <div className="ornament-divider"><span>◆</span></div>

              {/* Groupe utilitaires */}
              {[
                { to: "/search",   icon: "🔍", label: "Recherche" },
                { to: "/settings", icon: "⚙️", label: "Paramètres" },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-ember flex items-center gap-2.5 rounded px-3 py-2 mb-0.5 border-l-2 transition-all duration-150 ${
                      isActive ? "nav-link-active border-[#c9962a]" : "nav-link-inactive border-transparent"
                    }`
                  }
                >
                  <span style={{ fontSize: "0.95rem", minWidth: "18px", textAlign: "center" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Pied du menu */}
            <div style={{
              padding: "0.6rem 1rem",
              borderTop: "1px solid rgba(138,96,16,0.18)",
              background: "linear-gradient(0deg, rgba(80,30,5,0.25) 0%, transparent 100%)",
              textAlign: "center",
            }}>
              <span style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: "0.62rem",
                color: "#5a3c12",
                fontStyle: "italic",
              }}>
                🕯️ Le feu crépite
              </span>
            </div>
          </aside>

          {/* ═══════════════════ CONTENU ═══════════════════ */}
          <main className="self-start" style={{
            background: "transparent", border: "none", boxShadow: "none",
            padding: "0", minHeight: "calc(100vh - 140px)",
          }}>
            <Outlet />
          </main>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: "center", padding: "1rem 0 0.75rem", marginTop: "auto", width: "100%" }}>
          <p style={{
            fontFamily: "'Cinzel', serif", fontSize: "0.68rem",
            letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)",
            textTransform: "uppercase", textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}>
            ✦ &nbsp;Créé par Quentin.P &amp; Amélie.J&nbsp; ✦
          </p>
        </footer>
      </div>
    </>
  );
}
