import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CampaignSelector } from "./components/CampaignSelector";
import { CampaignDashboardPage } from "./pages/CampaignDashboardPage";
import { NpcDetailPage } from "./pages/NpcDetailPage";
import { NpcListPage } from "./pages/NpcListPage";
import { PlacesPage } from "./pages/PlacesPage";
import { SearchPage } from "./pages/SearchPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { SessionLivePage } from "./pages/SessionLivePage";
import { SessionsListPage } from "./pages/SessionsListPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<CampaignDashboardPage />} />
        <Route path="/campaigns" element={<CampaignSelector />} />
        <Route path="/sessions" element={<SessionsListPage />} />
        <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
        <Route path="/session/:sessionId/live" element={<SessionLivePage />} />
        <Route path="/campaign/:campaignId/places" element={<PlacesPage />} />
        <Route path="/npcs" element={<NpcListPage />} />
        <Route path="/npcs/:npcId" element={<NpcDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
