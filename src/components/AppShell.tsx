import {
  Archive,
  CircleHelp,
  FileText,
  FolderKanban,
  Settings,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { AppRoute, ToastState } from "../types";

interface AppShellProps {
  route: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  toast: ToastState | null;
  children: ReactNode;
}

const navItems: Array<{
  route: AppRoute;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { route: "generators", label: "Geradores", icon: FolderKanban },
  { route: "drafts", label: "Rascunhos", icon: Archive },
  { route: "settings", label: "Configurações", icon: Settings },
  { route: "help", label: "Ajuda", icon: CircleHelp },
];

export function AppShell({ route, onRouteChange, toast, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <img className="brand-logo brand-logo-light" src="/img/logo.png" alt="BRT" />
          <img className="brand-logo brand-logo-dark" src="/img/logo-branco.png" alt="BRT" />
          <div>
            <strong>Gerador</strong>
            <span>Ofícios BRT</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.route === route ||
              (item.route === "generators" && route === "lost-found");
            return (
              <button
                key={item.route}
                className={`nav-button ${active ? "active" : ""}`}
                onClick={() => onRouteChange(item.route)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <FileText size={20} />
            <span>Remaster modular</span>
          </div>
          {toast ? (
            <div className={`toast ${toast.tone}`} role="status" aria-live="polite">
              {toast.message}
            </div>
          ) : null}
        </header>

        <main className="page-frame">{children}</main>
      </div>
    </div>
  );
}
