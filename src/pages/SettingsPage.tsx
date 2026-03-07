import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useAppData } from "../state/AppDataContext";
import { useSettings } from "../state/SettingsContext";

export function SettingsPage() {
  const { data, resetDemoData, replaceData } = useAppData();
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isDimMode, setIsDimMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      setIsDimMode(localStorage.getItem("tor-live-dim-enabled") === "true");
    } catch {
      setIsDimMode(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("tor-live-dim-enabled", String(isDimMode));
    } catch {
      // Ignore storage failures (private mode, quota).
    }
  }, [isDimMode]);

  const onExport = () => {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "anneau-unique-sauvegarde.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => {
    setImportMessage(null);
    fileInputRef.current?.click();
  };

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as unknown;
      const result = replaceData(parsed);
      if (!result.ok) {
        setImportMessage(result.error ?? "Fichier de sauvegarde invalide.");
        return;
      }
      setImportMessage("Import terminé avec succès.");
      event.target.value = "";
    } catch (error) {
      setImportMessage("Impossible de lire le fichier.");
      console.error(error);
    }
  };

  return (
    <section
      className="space-y-6 p-6"
      style={{
        background: "linear-gradient(160deg, #fdf6e3, #f5e6c0)",
        border: "2px solid #8b5e2a",
        borderRadius: "2px 12px 2px 12px",
        boxShadow: "4px 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      <div>
        <h2 className="page-title">Paramètres</h2>
        <p className="page-subtitle">
          Actions utilitaires pour ce MVP local.
        </p>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Sauvegarde</h3>
        <p className="mb-3 mt-1 text-sm text-amber-950/80">
          Exportez vos données pour les conserver, puis importez-les pour
          restaurer une sauvegarde.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="btn-outline-medieval"
          >
            Exporter les données
          </button>
          <button
            type="button"
            onClick={onImportClick}
            className="btn-outline-medieval"
          >
            Importer une sauvegarde
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={onImportFile}
            className="hidden"
          />
        </div>
        {importMessage && (
          <p className="mt-2 text-sm text-amber-950/80">{importMessage}</p>
        )}
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Affichage</h3>
        <p className="mb-3 mt-1 text-sm text-amber-950/80">
          Réduit l’éblouissement sur iPad pendant la partie.
        </p>
        <label className="card card-muted card-compact flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isDimMode}
            onChange={(event) => setIsDimMode(event.target.checked)}
            className="h-5 w-5 accent-amber-900"
          />
          <span className="font-medium">Mode tamisé (Session Live)</span>
        </label>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Générateur de situation imprévue</h3>
        <p className="mb-3 mt-1 text-sm text-amber-950/80">
          Affiche un bouton “🎲 Situation imprévue” sous les choix de la scène
          (Session Live).
        </p>
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={settings.improvisationEnabled}
            onChange={(event) =>
              updateSettings({ improvisationEnabled: event.target.checked })
            }
            className="h-5 w-5 accent-amber-900"
          />
          Activer les situations imprévues
        </label>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Gestion des données</h3>
        <p className="mb-3 mt-1 text-sm text-amber-950/80">
          Réinitialiser toutes les données de campagne, de session et de PNJ aux
          valeurs de démo.
        </p>
        <button
          type="button"
          onClick={() => {
            const confirmed = window.confirm(
              "Réinitialiser toutes les données locales avec les valeurs de démo ?",
            );
            if (confirmed) {
              resetDemoData();
            }
          }}
          className="btn-danger-medieval"
        >
          Réinitialiser les données de démo
        </button>
      </div>
    </section>
  );
}
