import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { HelpMenu } from "./components/HelpMenu";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { CampaignDashboardPage } from "./pages/CampaignDashboardPage";
import { NpcDetailPage } from "./pages/NpcDetailPage";
import { NpcListPage } from "./pages/NpcListPage";
import { PlacesPage } from "./pages/PlacesPage";
import { SearchPage } from "./pages/SearchPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { SessionLivePage } from "./pages/SessionLivePage";
import { SessionsListPage } from "./pages/SessionsListPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PlayerCharactersPage } from "./pages/PlayerCharactersPage";
import woodTexture from "./assets/wood-texture.png";

export default function App() {
  const [hasChosen, setHasChosen] = useState(false);

  return (
    <div
      style={{
        backgroundImage: `url(${woodTexture})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        backgroundPosition: "center center",
        backgroundColor: "transparent",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!hasChosen ? (
        <WelcomeScreen onEnter={() => setHasChosen(true)} />
      ) : (
        <div style={{ paddingBottom: "2rem" }}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<CampaignDashboardPage />} />
              <Route path="/campaigns" element={<HomePage />} />
              <Route path="/sessions" element={<SessionsListPage />} />
              <Route
                path="/sessions/:sessionId"
                element={<SessionDetailPage />}
              />
              <Route
                path="/session/:sessionId/live"
                element={<SessionLivePage />}
              />
              <Route
                path="/campaign/:campaignId/places"
                element={<PlacesPage />}
              />
              <Route path="/npcs" element={<NpcListPage />} />
              <Route path="/npcs/:npcId" element={<NpcDetailPage />} />
              <Route path="/characters" element={<PlayerCharactersPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <HelpMenu />
        </div>
      )}
    </div>
  );
}
