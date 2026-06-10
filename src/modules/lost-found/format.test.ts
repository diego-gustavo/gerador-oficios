import { describe, expect, it } from "vitest";
import {
  brDateToIso,
  defaultLostFoundDocumentName,
  formatLostFoundItem,
  isoDateToBr,
  isValidBrDate,
} from "./format";
import { lostFoundFixture } from "./fixtures";
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

  it("matches the module fixture expected document name", () => {
    expect(
      defaultLostFoundDocumentName(
        lostFoundFixture.payload.year,
        lostFoundFixture.payload.officioNumber,
      ),
    ).toBe(lostFoundFixture.expectedDocumentName);
  });

  it("validates real Brazilian dates", () => {
    expect(isValidBrDate("05/06/2026")).toBe(true);
    expect(isValidBrDate("31/02/2026")).toBe(false);
  });

  it("converts valid dates between Brazilian and ISO formats", () => {
    expect(brDateToIso("05/06/2026")).toBe("2026-06-05");
    expect(isoDateToBr("2026-06-05")).toBe("05/06/2026");
    expect(brDateToIso("31/02/2026")).toBe("");
    expect(isoDateToBr("2026/06/05")).toBe("");
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

  it("keeps the required template tags documented in the fixture", () => {
    expect(lostFoundFixture.requiredTemplateTags).toEqual([
      "{{DATA}}",
      "{{OFICIO}}",
      "{{LISTA_ITENS}}",
    ]);
  });
});
