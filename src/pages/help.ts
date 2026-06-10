import { generatorModules } from "../modules/registry";
import { escapeHtml } from "../ui/dom";
import { icon } from "../ui/icons";

export function renderHelp(container: HTMLElement) {
  container.innerHTML = `
    <section class="page">
      <div class="section-title">
        <div>
          <h1>Ajuda</h1>
          <span>Uso rápido do gerador.</span>
        </div>
      </div>

      <div class="help-grid">
        ${generatorModules.map(renderModuleHelpCard).join("")}
      </div>
    </section>
  `;
}

function renderModuleHelpCard(module: (typeof generatorModules)[number]) {
  return `
    <section class="help-block module-help-card">
      <h2>${icon("file-text")} ${escapeHtml(module.name)}</h2>
      <p>${escapeHtml(module.description)}</p>
      <ol>
        ${module.helpSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <p>Tags do template: ${module.templateTags.map((tag) => escapeHtml(tag)).join(", ")}.</p>
    </section>
  `;
}
