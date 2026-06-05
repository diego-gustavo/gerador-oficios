import type { AppRoute, ToastState } from "../types";
import type { AppState } from "./state";

export interface AppContext {
  state: AppState;
  applyAppearance(): void;
  navigate(route: AppRoute): void;
  renderApp(): void;
  showToast(toast: ToastState): void;
}
