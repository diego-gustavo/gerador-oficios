import type { AppContext } from "../app/context";
import { generatorModules } from "../modules/registry";
import { Icon } from "../ui/icons";

// Página inicial: lista os módulos registrados sem conhecer regras internas.
export function GeneratorsPage({ context }: { context: AppContext }) {
  return (
    <section className="page">
      <div className="section-title">
        <div>
          <h1>Geradores</h1>
          <span>Módulos disponíveis para emissão de documentos.</span>
        </div>
      </div>
      <div className="module-grid">
        {generatorModules.map((module) => (
          <button
            key={module.moduleId}
            type="button"
            className="module-card"
            onClick={() => context.navigate(module.route)}
          >
            <span className="module-icon">
              <Icon name={module.iconName} />
            </span>
            <strong>{module.name}</strong>
            <small>{module.description}</small>
            <span className="module-open">
              Abrir <Icon name="arrow-right" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
