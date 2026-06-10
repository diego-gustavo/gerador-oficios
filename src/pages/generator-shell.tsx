import type { ReactNode } from "react";

// Moldura comum dos geradores: título, conteúdo e barra de ações fixa.
type GeneratorPageProps = {
  children: ReactNode;
  primaryAction: ReactNode;
  secondaryActions: ReactNode;
  subtitle: string;
  title: string;
};

export function GeneratorPage({
  children,
  primaryAction,
  secondaryActions,
  subtitle,
  title,
}: GeneratorPageProps) {
  return (
    <section className="page generator-page">
      <div className="page-main">
        <div className="section-title">
          <div>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
        </div>

        {children}

        <footer className="action-bar" aria-label="Ações do gerador">
          <div className="action-group">{secondaryActions}</div>
          {primaryAction}
        </footer>
      </div>
    </section>
  );
}
