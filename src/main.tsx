import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import type { AppContext } from "./app/context";
import { hashByRoute, routeByHash, routeTitle } from "./app/routes";
import { cloneConfig, createInitialState } from "./app/state";
import { normalizeConfig } from "./config/defaults";
import { DraftsPage, refreshDrafts } from "./pages/drafts";
import { GeneratorsPage } from "./pages/generators";
import { HelpPage } from "./pages/help";
import { LostFoundPage, refreshNextOfficio } from "./pages/lost-found";
import { SettingsPage } from "./pages/settings";
import { loadConfig } from "./services/tauri";
import type { AppRoute, ToastState } from "./types";
import { Icon } from "./ui/icons";

// Entrada React: mantém shell, navegação por hash e ciclo de renderização do app.
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado.");
}

function App() {
  // O estado fica em ref para preservar o modelo atual de mutação controlada
  // entre páginas, serviços e callbacks assíncronos.
  const stateRef = useRef(
    createInitialState(routeByHash[window.location.hash] || "generators"),
  );
  const toastTimer = useRef<number | null>(null);
  const contextRef = useRef<AppContext | null>(null);
  const [, forceRender] = useReducer((value: number) => value + 1, 0);

  const renderApp = useCallback(() => {
    forceRender();
  }, []);

  const applyAppearance = useCallback(() => {
    // Tema, contraste e escala são aplicados no elemento raiz para o CSS inteiro.
    const config = normalizeConfig(stateRef.current.config);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = config.theme === "system" ? (prefersDark ? "dark" : "light") : config.theme;

    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.contrast = config.highContrast ? "high" : "normal";
    document.documentElement.style.setProperty("--ui-scale", `${config.interfaceScale / 100}`);
  }, []);

  const prepareRoute = useCallback((route: AppRoute) => {
    // Algumas telas precisam de estado temporário novo sempre que entram.
    if (route === "settings") {
      stateRef.current.settingsDraft = cloneConfig(stateRef.current.config);
    }
    if (route !== "drafts") {
      stateRef.current.renameDraftId = null;
    }
  }, []);

  const afterRouteRender = useCallback((route: AppRoute) => {
    // Carregamentos dependentes de rota ficam aqui para não rodarem em toda renderização.
    const context = contextRef.current;
    if (!context) {
      return;
    }
    if (route === "drafts") {
      void refreshDrafts(context);
    }
    if (route === "lost-found") {
      void refreshNextOfficio(context);
    }
  }, []);

  const navigate = useCallback(
    (route: AppRoute) => {
      stateRef.current.route = route;
      prepareRoute(route);

      const hash = hashByRoute[route];
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }

      renderApp();
      afterRouteRender(route);
    },
    [afterRouteRender, prepareRoute, renderApp],
  );

  const showToast = useCallback(
    (toast: ToastState) => {
      stateRef.current.toast = toast;
      renderApp();

      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
      toastTimer.current = window.setTimeout(() => {
        stateRef.current.toast = null;
        renderApp();
      }, 4200);
    },
    [renderApp],
  );

  const context = useMemo<AppContext>(
    () => ({
      state: stateRef.current,
      applyAppearance,
      navigate,
      renderApp,
      showToast,
    }),
    [applyAppearance, navigate, renderApp, showToast],
  );
  contextRef.current = context;

  useEffect(() => {
    function handleHashChange() {
      const route = routeByHash[window.location.hash] || "generators";
      if (route !== stateRef.current.route) {
        stateRef.current.route = route;
        prepareRoute(route);
        renderApp();
        afterRouteRender(route);
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [afterRouteRender, prepareRoute, renderApp]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyAppearance);
    return () => media.removeEventListener("change", applyAppearance);
  }, [applyAppearance]);

  useEffect(() => {
    // Configuração local/Tauri substitui os defaults assim que estiver disponível.
    applyAppearance();

    loadConfig()
      .then((config) => {
        stateRef.current.config = normalizeConfig(config);
        applyAppearance();
        renderApp();
        afterRouteRender(stateRef.current.route);
      })
      .catch((error) => {
        showToast({
          tone: "warning",
          message:
            error instanceof Error
              ? error.message
              : "Configurações padrão carregadas.",
        });
      });
  }, [afterRouteRender, applyAppearance, renderApp, showToast]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo brand-logo-light" src="/img/logo.png" alt="BRT Sorocaba" />
          <img
            className="brand-logo brand-logo-dark"
            src="/img/logo-branco.png"
            alt="BRT Sorocaba"
          />
          <div>
            <strong>Gerador BRT</strong>
            <span>Ofícios operacionais</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Principal">
          <NavButton context={context} iconName="layout-dashboard" label="Geradores" route="generators" />
          <NavButton context={context} iconName="file-plus-2" label="Achados" route="lost-found" />
          <NavButton context={context} iconName="archive" label="Rascunhos" route="drafts" />
          <NavButton context={context} iconName="settings" label="Config" route="settings" />
          <NavButton context={context} iconName="circle-help" label="Ajuda" route="help" />
        </nav>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <Icon name="panel-top" />
            <span>{routeTitle[context.state.route]}</span>
          </div>
          <Toast toast={context.state.toast} />
        </header>
        <div className="page-frame" id="page">
          <CurrentPage context={context} />
        </div>
      </main>
    </div>
  );
}

type NavButtonProps = {
  context: AppContext;
  iconName: string;
  label: string;
  route: AppRoute;
};

function NavButton({ context, iconName, label, route }: NavButtonProps) {
  const active = context.state.route === route ? " active" : "";
  return (
    <button
      type="button"
      className={`nav-button${active}`}
      onClick={() => context.navigate(route)}
    >
      <Icon name={iconName} />
      <span>{label}</span>
    </button>
  );
}

function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <div id="toast-slot" role="status" aria-live="polite">
      {toast ? <div className={`toast ${toast.tone}`}>{toast.message}</div> : null}
    </div>
  );
}

function CurrentPage({ context }: { context: AppContext }) {
  switch (context.state.route) {
    case "lost-found":
      return <LostFoundPage context={context} />;
    case "drafts":
      return <DraftsPage context={context} />;
    case "settings":
      return <SettingsPage context={context} />;
    case "help":
      return <HelpPage />;
    case "generators":
    default:
      return <GeneratorsPage context={context} />;
  }
}

createRoot(rootElement).render(<App />);
