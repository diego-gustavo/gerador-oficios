import type { AppRoute } from "../types";

// Rotas públicas do hash para manter navegação simples dentro do Tauri/WebView.
export const routeByHash: Record<string, AppRoute> = {
  "#geradores": "generators",
  "#achados-e-perdidos": "lost-found",
  "#rascunhos": "drafts",
  "#configuracoes": "settings",
  "#ajuda": "help",
};

export const hashByRoute: Record<AppRoute, string> = {
  generators: "#geradores",
  "lost-found": "#achados-e-perdidos",
  drafts: "#rascunhos",
  settings: "#configuracoes",
  help: "#ajuda",
};

export const routeTitle: Record<AppRoute, string> = {
  generators: "Geradores",
  "lost-found": "Achados e Perdidos",
  drafts: "Rascunhos",
  settings: "Configurações",
  help: "Ajuda",
};
