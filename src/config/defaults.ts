import { AppConfig, LOST_FOUND_MODULE_ID } from "../types";

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
  modules: {
    [LOST_FOUND_MODULE_ID]: {
      templatePath: "resources/templates/achados-e-perdidos/template.docx",
      suggestions: defaultSuggestions,
    },
  },
};

export function normalizeConfig(config: Partial<AppConfig> | null | undefined): AppConfig {
  const lostFound = config?.modules?.[LOST_FOUND_MODULE_ID];

  return {
    ...defaultConfig,
    ...config,
    modules: {
      ...defaultConfig.modules,
      ...config?.modules,
      [LOST_FOUND_MODULE_ID]: {
        ...defaultConfig.modules[LOST_FOUND_MODULE_ID],
        ...lostFound,
        suggestions:
          lostFound?.suggestions && lostFound.suggestions.length > 0
            ? lostFound.suggestions
            : defaultSuggestions,
      },
    },
  };
}
