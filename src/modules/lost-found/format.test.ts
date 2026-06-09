import { describe, expect, it } from "vitest";
import {
  defaultLostFoundDocumentName,
  formatLostFoundItem,
  isValidBrDate,
} from "./format";
import { validateLostFoundPayload } from "./module";

describe("lost-found format helpers", () => {
  it("formats item with optional brand, description and note", () => {
    expect(
      formatLostFoundItem({
        id: "1",
        item: "Carteira",
        marca: "Couro",
        descricao: "marrom",
        observacao: "com documentos",
      }),
    ).toBe('Carteira "Couro" - marrom (com documentos)');
  });

  it("builds default document name with padded number", () => {
    expect(defaultLostFoundDocumentName(2026, "7/2026")).toBe(
      "2026 007 - Encaminhamento de Achados e Perdidos",
    );
  });

  it("validates real Brazilian dates", () => {
    expect(isValidBrDate("05/06/2026")).toBe(true);
    expect(isValidBrDate("31/02/2026")).toBe(false);
  });
});

describe("lost-found module validation", () => {
  const validPayload = {
    year: 2026,
    officioNumber: "7/2026",
    officioDate: "05/06/2026",
    documentName: "2026 007 - Encaminhamento de Achados e Perdidos",
    responsible: "Operacao",
    items: [{ id: "1", item: "RG" }],
  };

  it("accepts a complete payload", () => {
    expect(validateLostFoundPayload(validPayload)).toBeNull();
  });

  it("requires at least one item", () => {
    expect(validateLostFoundPayload({ ...validPayload, items: [] })).toBe(
      "Adicione pelo menos um item.",
    );
  });
});
