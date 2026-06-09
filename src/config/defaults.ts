import { AppConfig, LOST_FOUND_MODULE_ID } from "../types";
import { generatorModules } from "../modules/registry";

export const defaultSuggestions = [
  "Vale Transporte",
  "RG",
  "CIN",
  "Carteira",
  "Cartão",
  "Celular",
  "Chave",
  "Documento",
  "Bolsa",
  "Mochila",
  "Óculos",
  "Fone de Ouvido",
  "Carregador",
  "Guarda-chuva/sol",
  "Jaqueta",
  "Outros",
];

export const defaultConfig: AppConfig = {
  excelPath: "J:/Usuários/Documentos Gerais/Controle Ofícios - BRT Operação.xlsx",
  defaultSaveDir:
    "M:/Remissão/Base/Relatórios Fechados/Ofícios e protocolos/Ofícios 2026 - BRT",
  theme: "system",
  interfaceScale: 100,
  highContrast: false,
  modules: Object.fromEntries(
    generatorModules.map((module) => [
      module.moduleId,
      {
        templatePath: module.defaultTemplatePath,
        suggestions: module.moduleId === LOST_FOUND_MODULE_ID ? defaultSuggestions : [],
        excelSubject: module.excel.subject,
        excelDestination: module.excel.destination,
        excelColumns: module.excel.columns,
      },
    ]),
  ),
};

export function normalizeConfig(config: Partial<AppConfig> | null | undefined): AppConfig {
  const modules = Object.fromEntries(
    generatorModules.map((module) => {
      const moduleDefaults = defaultConfig.modules[module.moduleId];
      const current = config?.modules?.[module.moduleId];
      return [
        module.moduleId,
        {
          ...moduleDefaults,
          ...current,
          suggestions:
            current?.suggestions && current.suggestions.length > 0
              ? current.suggestions
              : moduleDefaults.suggestions,
          excelSubject:
            current?.excelSubject?.trim() || moduleDefaults.excelSubject,
          excelDestination:
            current?.excelDestination?.trim() || moduleDefaults.excelDestination,
          excelColumns: {
            ...moduleDefaults.excelColumns,
            ...current?.excelColumns,
          },
        },
      ];
    }),
  );

  return {
    ...defaultConfig,
    ...config,
    modules: {
      ...modules,
    },
  };
}
