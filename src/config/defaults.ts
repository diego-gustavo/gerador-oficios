import { AppConfig, LOST_FOUND_MODULE_ID } from "../types";
import { generatorModules } from "../modules/registry";

const defaultExcelPath =
  "J:/Usuários/Documentos Gerais/Controle Ofícios - BRT Operação.xlsx";
const defaultSaveDir =
  "M:/Remissão/Base/Relatórios Fechados/Ofícios e protocolos/Ofícios 2026 - BRT";

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
  theme: "system",
  interfaceScale: 100,
  highContrast: false,
  modules: Object.fromEntries(
    generatorModules.map((module) => [
      module.moduleId,
      {
        excelPath: defaultExcelPath,
        defaultSaveDir,
        templatePath: module.defaultTemplatePath,
        suggestions: module.moduleId === LOST_FOUND_MODULE_ID ? defaultSuggestions : [],
        excelSubject: module.excel.subject,
        excelDestination: module.excel.destination,
        excelColumns: module.excel.columns,
      },
    ]),
  ),
};

type LegacyAppConfig = Partial<AppConfig> & {
  excelPath?: string;
  defaultSaveDir?: string;
};

export function normalizeConfig(config: LegacyAppConfig | null | undefined): AppConfig {
  // Configurações antigas tinham caminhos globais. A normalização migra esses
  // valores para o módulo para manter um único card completo por gerador.
  const legacyExcelPath = config?.excelPath?.trim();
  const legacyDefaultSaveDir = config?.defaultSaveDir?.trim();
  const modules = Object.fromEntries(
    generatorModules.map((module) => {
      const moduleDefaults = defaultConfig.modules[module.moduleId];
      const current = config?.modules?.[module.moduleId];
      return [
        module.moduleId,
        {
          ...moduleDefaults,
          ...current,
          excelPath:
            current?.excelPath?.trim() ||
            legacyExcelPath ||
            moduleDefaults.excelPath,
          defaultSaveDir:
            current?.defaultSaveDir?.trim() ||
            legacyDefaultSaveDir ||
            moduleDefaults.defaultSaveDir,
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
    theme: config?.theme || defaultConfig.theme,
    interfaceScale: config?.interfaceScale || defaultConfig.interfaceScale,
    highContrast: Boolean(config?.highContrast),
    modules,
  };
}
