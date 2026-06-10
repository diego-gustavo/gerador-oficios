import "./styles/app.css";
import type { AppContext } from "./app/context";
import { hashByRoute, routeByHash, routeTitle } from "./app/routes";
import { cloneConfig, createInitialState } from "./app/state";
import { normalizeConfig } from "./config/defaults";
import { renderDrafts, refreshDrafts } from "./pages/drafts";
import { renderGenerators } from "./pages/generators";
import { renderHelp } from "./pages/help";
import { refreshNextOfficio, renderLostFound } from "./pages/lost-found";
import { renderSettings } from "./pages/settings";
import { loadConfig } from "./services/tauri";
import type { AppRoute, ToastState } from "./types";
import { escapeHtml, query } from "./ui/dom";
import { icon } from "./ui/icons";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root não encontrado.");
}

const appRoot = rootElement;
const state = createInitialState(routeByHash[window.location.hash] || "generators");
let toastTimer: number | null = null;

const context: AppContext = {
  state,
  applyAppearance,
  navigate,
  renderApp,
  showToast,
};

function showToast(toast: ToastState) {
  state.toast = toast;
  renderToast();
  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    state.toast = null;
    renderToast();
  }, 4200);
}

function renderToast() {
  const slot = document.getElementById("toast-slot");
  if (!slot) {
    return;
  }
  slot.innerHTML = state.toast
    ? `<div class="toast ${state.toast.tone}">${escapeHtml(state.toast.message)}</div>`
    : "";
}

function applyAppearance() {
  const config = normalizeConfig(state.config);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = config.theme === "system" ? (prefersDark ? "dark" : "light") : config.theme;

  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.contrast = config.highContrast ? "high" : "normal";
  document.documentElement.style.setProperty("--ui-scale", `${config.interfaceScale / 100}`);
}

function prepareRoute(route: AppRoute) {
  if (route === "settings") {
    state.settingsDraft = cloneConfig(state.config);
  }
  if (route !== "drafts") {
    state.renameDraftId = null;
  }
}

function navigate(route: AppRoute) {
  state.route = route;
  prepareRoute(route);

  const hash = hashByRoute[route];
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }

  renderApp();
  afterRouteRender(route);
}

function afterRouteRender(route: AppRoute) {
  if (route === "drafts") {
    void refreshDrafts(context);
  }
  if (route === "lost-found") {
    void refreshNextOfficio(context);
  }
}

function renderApp() {
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-logo brand-logo-light" src="/img/logo.png" alt="BRT Sorocaba" />
          <img class="brand-logo brand-logo-dark" src="/img/logo-branco.png" alt="BRT Sorocaba" />
          <div>
            <strong>Gerador BRT</strong>
            <span>Ofícios operacionais</span>
          </div>
        </div>
        <nav class="nav-list" aria-label="Principal">
          ${navButton("generators", "layout-dashboard", "Geradores")}
          ${navButton("lost-found", "file-plus-2", "Achados")}
          ${navButton("drafts", "archive", "Rascunhos")}
          ${navButton("settings", "settings", "Config")}
          ${navButton("help", "circle-help", "Ajuda")}
        </nav>
      </aside>
      <main class="workspace">
        <header class="topbar">
          <div class="topbar-title">${icon("panel-top")}<span>${escapeHtml(routeTitle[state.route])}</span></div>
          <div id="toast-slot" role="status" aria-live="polite"></div>
        </header>
        <div class="page-frame" id="page"></div>
      </main>
    </div>
  `;

  appRoot.querySelectorAll<HTMLButtonElement>("[data-route]").forEach((item) => {
    item.addEventListener("click", () => navigate(item.dataset.route as AppRoute));
  });

  const page = query<HTMLDivElement>("#page", appRoot);
  switch (state.route) {
    case "lost-found":
      renderLostFound(page, context);
      break;
    case "drafts":
      renderDrafts(page, context);
      break;
    case "settings":
      renderSettings(page, context);
      break;
    case "help":
      renderHelp(page);
      break;
    case "generators":
    default:
      renderGenerators(page, context);
      break;
  }

  renderToast();
}

function navButton(route: AppRoute, iconName: string, label: string) {
  const active = state.route === route ? " active" : "";
  return `
    <button type="button" class="nav-button${active}" data-route="${route}">
      ${icon(iconName)}
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

window.addEventListener("hashchange", () => {
  const route = routeByHash[window.location.hash] || "generators";
  if (route !== state.route) {
    state.route = route;
    prepareRoute(route);
    renderApp();
    afterRouteRender(route);
  }
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", applyAppearance);

applyAppearance();
renderApp();

loadConfig()
  .then((config) => {
    state.config = normalizeConfig(config);
    applyAppearance();
    renderApp();
    afterRouteRender(state.route);
  })
  .catch((error) => {
    showToast({
      tone: "warning",
      message: error instanceof Error ? error.message : "Configurações padrão carregadas.",
    });
  });
