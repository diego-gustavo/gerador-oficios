import { escapeHtml } from "../ui/dom";

type GeneratorPageOptions = {
  title: string;
  subtitle: string;
  content: string;
  secondaryActions: string;
  primaryAction: string;
};

export function renderGeneratorPage(options: GeneratorPageOptions) {
  return `
    <section class="page generator-page">
      <div class="page-main">
        <div class="section-title">
          <div>
            <h1>${escapeHtml(options.title)}</h1>
            <span>${escapeHtml(options.subtitle)}</span>
          </div>
        </div>

        ${options.content}

        <footer class="action-bar" aria-label="Ações do gerador">
          <div class="action-group">${options.secondaryActions}</div>
          ${options.primaryAction}
        </footer>
      </div>
    </section>
  `;
}
