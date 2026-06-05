import { ArrowRight, FileText } from "lucide-react";
import { generatorModules } from "../modules/registry";
import { AppRoute } from "../types";

interface GeneratorsPageProps {
  onOpen: (route: AppRoute) => void;
}

export function GeneratorsPage({ onOpen }: GeneratorsPageProps) {
  return (
    <section className="page">
      <div className="section-title">
        <div>
          <h1>Geradores</h1>
          <span>Módulos disponíveis</span>
        </div>
      </div>

      <div className="module-grid">
        {generatorModules.map((module) => (
          <button
            key={module.moduleId}
            className="module-card"
            type="button"
            onClick={() => onOpen(module.route)}
          >
            <span className="module-icon">
              <FileText size={24} />
            </span>
            <strong>{module.name}</strong>
            <small>{module.description}</small>
            <span className="module-open">
              Abrir <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
