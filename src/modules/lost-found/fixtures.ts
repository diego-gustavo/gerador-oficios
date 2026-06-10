import { LOST_FOUND_MODULE_ID, LostFoundGeneratePayload } from "../../types";

// Fixture canônica: alinha testes de nome, tags e payload exemplo.
export const lostFoundFixture = {
  moduleId: LOST_FOUND_MODULE_ID,
  expectedDocumentName: "2026 007 - Encaminhamento de Achados e Perdidos",
  requiredTemplateTags: ["{{DATA}}", "{{OFICIO}}", "{{LISTA_ITENS}}"],
  payload: {
    year: 2026,
    officioNumber: "7/2026",
    officioDate: "05/06/2026",
    documentName: "2026 007 - Encaminhamento de Achados e Perdidos",
    responsible: "Operacao",
    items: [
      {
        id: "item-1",
        item: "Carteira",
        marca: "Couro",
        descricao: "marrom",
        observacao: "com documentos",
      },
    ],
  } satisfies LostFoundGeneratePayload,
};
