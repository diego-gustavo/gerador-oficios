import type { AppRoute, ToastState } from "../types";
import type { AppState } from "./state";

// Contrato compartilhado pelas páginas: estado mutável, navegação e feedback visual.
export interface AppContext {
  state: AppState;
  applyAppearance(): void;
  navigate(route: AppRoute): void;
  renderApp(): void;
  showToast(toast: ToastState): void;
}
