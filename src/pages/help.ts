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
        <section class="help-block">
          <h2>${icon("list-checks")} Passo a passo</h2>
          <ol>
            <li>Verifique ano e numero do oficio.</li>
            <li>Preencha data, responsavel e itens.</li>
            <li>Adicione cada item com marca e descricao quando houver.</li>
            <li>Salve rascunho se precisar interromper.</li>
            <li>Gere o oficio e confirme o registro na planilha.</li>
          </ol>
        </section>
        <section class="help-block">
          <h2>${icon("file-text")} Template Word</h2>
          <p>O template precisa conter as tags {{DATA}}, {{OFICIO}} e {{LISTA_ITENS}}.</p>
        </section>
        <section class="help-block">
          <h2>${icon("sheet")} Planilha</h2>
          <p>A aba do ano deve conter o texto Oficios Emitidos. O app registra numero, assunto, data, destino e responsavel.</p>
        </section>
      </div>
    </section>
  `;
}
