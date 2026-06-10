import { describe, expect, it } from "vitest";
import { lostFoundFixture } from "./lost-found/fixtures";
import { defaultLostFoundDocumentName } from "./lost-found/format";
import { generatorModules, getModule } from "./registry";

// Fixtures funcionam como contrato mínimo entre registro, template e payload.
const moduleFixtures = [lostFoundFixture];

describe("generator module registry", () => {
  it("has a fixture for every registered module", () => {
    expect(moduleFixtures.map((fixture) => fixture.moduleId).sort()).toEqual(
      generatorModules.map((module) => module.moduleId).sort(),
    );
  });

  it("keeps required tags aligned with module fixtures", () => {
    moduleFixtures.forEach((fixture) => {
      const module = getModule(fixture.moduleId);
      expect(module?.templateTags).toEqual(fixture.requiredTemplateTags);
    });
  });

  it("keeps expected document names aligned with sample payloads", () => {
    expect(
      defaultLostFoundDocumentName(
        lostFoundFixture.payload.year,
        lostFoundFixture.payload.officioNumber,
      ),
    ).toBe(lostFoundFixture.expectedDocumentName);
  });
});
