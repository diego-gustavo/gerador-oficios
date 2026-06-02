import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./components/AppShell";
import { defaultConfig, normalizeConfig } from "./config/defaults";
import { DraftsPage } from "./pages/DraftsPage";
import { GeneratorsPage } from "./pages/GeneratorsPage";
import { HelpPage } from "./pages/HelpPage";
import { LostFoundPage } from "./pages/LostFoundPage";
import { SettingsPage } from "./pages/SettingsPage";
import { loadConfig } from "./services/tauri";
import {
  AppConfig,
  AppRoute,
  LostFoundDraftPayload,
  ModuleDraft,
  ToastState,
} from "./types";

const routeByHash: Record<string, AppRoute> = {
  "#geradores": "generators",
  "#achados-e-perdidos": "lost-found",
  "#rascunhos": "drafts",
  "#configuracoes": "settings",
  "#ajuda": "help",
};

const hashByRoute: Record<AppRoute, string> = {
  generators: "#geradores",
  "lost-found": "#achados-e-perdidos",
  drafts: "#rascunhos",
  settings: "#configuracoes",
  help: "#ajuda",
};

function getInitialRoute(): AppRoute {
  return routeByHash[window.location.hash] || "generators";
}

export default function App() {
  const [route, setRouteState] = useState<AppRoute>(getInitialRoute);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingLostFoundDraft, setPendingLostFoundDraft] =
    useState<ModuleDraft<LostFoundDraftPayload> | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const setRoute = useCallback((nextRoute: AppRoute) => {
    setRouteState(nextRoute);
    const hash = hashByRoute[nextRoute];
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setRouteState(getInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    loadConfig()
      .then((loaded) => setConfig(normalizeConfig(loaded)))
      .catch((error) => {
        showToast({
          tone: "warning",
          message:
            error instanceof Error
              ? error.message
              : "Configurações padrão carregadas.",
        });
      });
  }, [showToast]);

  useEffect(() => {
    const normalized = normalizeConfig(config);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme =
      normalized.theme === "system"
        ? prefersDark
          ? "dark"
          : "light"
        : normalized.theme;

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.contrast = normalized.highContrast ? "high" : "normal";
    document.documentElement.style.setProperty(
      "--ui-scale",
      `${normalized.interfaceScale / 100}`,
    );
  }, [config]);

  const page = useMemo(() => {
    switch (route) {
      case "lost-found":
        return (
          <LostFoundPage
            config={config}
            initialDraft={pendingLostFoundDraft}
            onDraftConsumed={() => setPendingLostFoundDraft(null)}
            onRouteChange={setRoute}
            showToast={showToast}
          />
        );
      case "drafts":
        return (
          <DraftsPage
            showToast={showToast}
            onOpenLostFoundDraft={(draft) => {
              setPendingLostFoundDraft(draft);
              setRoute("lost-found");
            }}
          />
        );
      case "settings":
        return (
          <SettingsPage
            config={config}
            showToast={showToast}
            onConfigSaved={setConfig}
          />
        );
      case "help":
        return <HelpPage />;
      case "generators":
      default:
        return <GeneratorsPage onOpen={setRoute} />;
    }
  }, [config, pendingLostFoundDraft, route, setRoute, showToast]);

  return (
    <AppShell route={route} onRouteChange={setRoute} toast={toast}>
      {page}
    </AppShell>
  );
}
