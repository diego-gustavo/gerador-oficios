import { generatorModules } from "../modules/registry";
import { Icon } from "../ui/icons";

// Ajuda deriva do registro para evitar documentação interna divergente.
export function HelpPage() {
  return (
    <section className="page">
      <div className="section-title">
        <div>
          <h1>Ajuda</h1>
          <span>Uso rápido do gerador.</span>
        </div>
      </div>

      <div className="help-grid">
        {generatorModules.map((module) => (
          <section className="help-block module-help-card" key={module.moduleId}>
            <h2>
              <Icon name="file-text" /> {module.name}
            </h2>
            <p>{module.description}</p>
            <ol>
              {module.helpSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p>Tags do template: {module.templateTags.join(", ")}.</p>
          </section>
        ))}
      </div>
    </section>
  );
}
