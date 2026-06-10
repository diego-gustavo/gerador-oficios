import { GeneratorModule, LOST_FOUND_MODULE_ID } from "../types";

export const generatorModules: GeneratorModule[] = [
  {
    moduleId: LOST_FOUND_MODULE_ID,
    name: "Achados e Perdidos",
    shortName: "Achados",
    route: "lost-found",
    description: "Encaminhamento de itens localizados para registro oficial.",
    iconName: "file-text",
    defaultDraftName: "Achados e Perdidos",
    defaultTemplatePath: "resources/templates/achados-e-perdidos/template.docx",
    usesSuggestions: true,
    templateTags: ["{{DATA}}", "{{OFICIO}}", "{{LISTA_ITENS}}"],
    excel: {
      subject: "Encaminhamento de Achados e Perdidos",
      destination: "Urbes",
      columns: {
        number: "A",
        subject: "B",
        date: "C",
        destination: "D",
        responsible: "E",
      },
    },
    helpSteps: [
      "Confira ano, número e data do ofício.",
      "Preencha responsável e itens no formato Item \"Marca\" - Descrição (Observação).",
      "Use rascunhos para salvar uma emissão em andamento.",
      "Gere o documento e registre a emissão na planilha configurada.",
    ],
  },
];

export function getModule(moduleId: string) {
  return generatorModules.find((module) => module.moduleId === moduleId);
}
