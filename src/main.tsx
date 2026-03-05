import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AppDataProvider } from "./state/AppDataContext";
import { SettingsProvider } from "./state/SettingsContext";
import { registerSW } from "virtual:pwa-register";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <SettingsProvider>
        <AppDataProvider>
          <App />
        </AppDataProvider>
      </SettingsProvider>
    </HashRouter>
  </React.StrictMode>,
);

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
