import { generatorModules } from "../modules/registry";
import { escapeHtml } from "../ui/dom";
import { icon } from "../ui/icons";

export function renderHelp(container: HTMLElement) {
  container.innerHTML = `
    <section class="page">
      <div class="section-title">
        <div>
          <h1>Ajuda</h1>
          <span>Uso rapido do gerador.</span>
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
        <li>Confira ano, numero e data do oficio.</li>
        <li>Preencha responsavel e itens no formato Item "Marca" - Descricao (Observacao).</li>
        <li>Use rascunhos para salvar uma emissao em andamento.</li>
        <li>Gere o documento e registre a emissao na planilha configurada.</li>
      </ol>
      <p>Tags do template: ${module.templateTags.map((tag) => escapeHtml(tag)).join(", ")}.</p>
    </section>
  `;
}
