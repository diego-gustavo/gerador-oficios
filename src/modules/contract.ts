import type { AppRoute, ExcelColumnMap } from "../types";

export interface GeneratorModule {
  moduleId: string;
  name: string;
  shortName: string;
  route: AppRoute;
  description: string;
  iconName: string;
  defaultDraftName: string;
  defaultTemplatePath: string;
  usesSuggestions: boolean;
  templateTags: string[];
  excel: {
    subject: string;
    destination: string;
    columns: ExcelColumnMap;
  };
  helpSteps: string[];
}

export interface GeneratorModuleAdapter<TPayload> {
  moduleId: string;
  defaultDraftName: string;
  defaultDocumentName(year: number, officioNumber: string): string;
  validate(payload: TPayload): string | null;
}

export interface ModuleFixture<TPayload = unknown> {
  moduleId: string;
  expectedDocumentName: string;
  requiredTemplateTags: string[];
  payload: TPayload;
}

export function defineGeneratorModule<TModule extends GeneratorModule>(
  module: TModule,
) {
  // Helper de identidade: mantém inferência literal e aplica o contrato do registry.
  return module;
}

export function defineModuleFixture<TPayload>(
  fixture: ModuleFixture<TPayload>,
) {
  // Fixtures tipadas viram a fonte de verdade dos testes de contrato por módulo.
  return fixture;
}

export function validateGeneratorModuleContract(
  modules: GeneratorModule[],
  fixtures: ModuleFixture[],
) {
  // Validação central evita que novos módulos entrem sem fixture, tags ou Excel mínimo.
  const errors: string[] = [];
  const moduleIds = modules.map((module) => module.moduleId);
  const fixtureIds = fixtures.map((fixture) => fixture.moduleId);
  const duplicateModuleIds = moduleIds.filter(
    (moduleId, index) => moduleIds.indexOf(moduleId) !== index,
  );

  duplicateModuleIds.forEach((moduleId) => {
    errors.push(`Módulo duplicado no registro: ${moduleId}`);
  });

  modules.forEach((module) => {
    const fixture = fixtures.find((item) => item.moduleId === module.moduleId);
    if (!fixture) {
      errors.push(`Fixture ausente para o módulo ${module.moduleId}`);
      return;
    }
    if (!module.templateTags.length) {
      errors.push(`Tags de template ausentes para o módulo ${module.moduleId}`);
    }
    if (module.templateTags.join("|") !== fixture.requiredTemplateTags.join("|")) {
      errors.push(`Tags de template divergentes para o módulo ${module.moduleId}`);
    }
    if (!module.excel.subject.trim() || !module.excel.destination.trim()) {
      errors.push(`Configuração de planilha incompleta para o módulo ${module.moduleId}`);
    }
  });

  fixtureIds
    .filter((fixtureId) => !moduleIds.includes(fixtureId))
    .forEach((fixtureId) => {
      errors.push(`Fixture sem módulo registrado: ${fixtureId}`);
    });

  return errors;
}
