import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPO ?? "";
  const base = repoName ? `/${repoName}/` : "/";

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        manifestFilename: "manifest.webmanifest",
        includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
        manifest: {
          name: "L'Anneau Unique - Carnet du MJ",
          short_name: "Carnet MJ",
          start_url: base,
          scope: base,
          display: "standalone",
          theme_color: "#e8e1d2",
          background_color: "#f1ece0",
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        },
        workbox: {
          navigateFallback: "index.html"
        }
      })
    ]
  };
});
