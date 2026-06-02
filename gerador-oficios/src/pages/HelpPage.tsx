import { CircleHelp } from "lucide-react";

export function HelpPage() {
  return (
    <section className="page help-page">
      <div className="section-title">
        <div>
          <h1>Ajuda</h1>
          <span>Uso operacional</span>
        </div>
      </div>

      <div className="help-grid">
        <section className="help-block">
          <h2>
            <CircleHelp size={18} /> Achados e Perdidos
          </h2>
          <ol>
            <li>Confira o ano e o próximo número do ofício.</li>
            <li>Preencha data, responsável e itens.</li>
            <li>Use marca e descrição quando o item precisar de detalhe.</li>
            <li>Gere o documento e confirme o registro na planilha.</li>
          </ol>
        </section>

        <section className="help-block">
          <h2>Rascunhos</h2>
          <p>
            Cada módulo possui seus próprios rascunhos. Um rascunho de Achados e
            Perdidos não aparece dentro de outro gerador.
          </p>
        </section>

        <section className="help-block">
          <h2>Templates</h2>
          <p>
            O template do módulo Achados e Perdidos precisa conter as tags
            {" {{DATA}}, {{OFICIO}} "}e{" {{LISTA_ITENS}}"}.
          </p>
        </section>

        <section className="help-block">
          <h2>Planilha</h2>
          <p>
            A aba usada deve conter o ano e “Ofícios Emitidos” no nome. O app
            calcula o próximo número lendo a primeira coluna.
          </p>
        </section>
      </div>
    </section>
  );
}
