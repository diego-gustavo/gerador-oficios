import type { AppContext } from "../app/context";
import { generatorModules } from "../modules/registry";
import type { AppRoute } from "../types";
import { escapeAttr, escapeHtml } from "../ui/dom";
import { icon } from "../ui/icons";

export function renderGenerators(container: HTMLElement, context: AppContext) {
  container.innerHTML = `
    <section class="page">
      <div class="section-title">
        <div>
          <h1>Geradores</h1>
          <span>Modulos disponiveis para emissao de documentos.</span>
        </div>
      </div>
      <div class="module-grid">
        ${generatorModules
          .map(
            (module) => `
              <button type="button" class="module-card" data-open-module="${escapeAttr(module.route)}">
                <span class="module-icon">${icon(module.iconName)}</span>
                <strong>${escapeHtml(module.name)}</strong>
                <small>${escapeHtml(module.description)}</small>
                <span class="module-open">Abrir ${icon("arrow-right")}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;

  container.querySelectorAll<HTMLButtonElement>("[data-open-module]").forEach((item) => {
    item.addEventListener("click", () => context.navigate(item.dataset.openModule as AppRoute));
  });
}
