import { describe, expect, it } from "vitest";
import { defaultConfig, normalizeConfig } from "../config/defaults";
import { validateGeneratorModuleContract } from "./contract";
import { lostFoundFixture } from "./lost-found/fixtures";
import { defaultLostFoundDocumentName } from "./lost-found/format";
import { generatorModules, getModule } from "./registry";

// Fixtures funcionam como contrato mínimo entre registro, template e payload.
const moduleFixtures = [lostFoundFixture];

describe("generator module registry", () => {
  it("satisfies the shared module contract", () => {
    expect(validateGeneratorModuleContract(generatorModules, moduleFixtures)).toEqual([]);
  });

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

  it("keeps module-specific config separated from global appearance", () => {
    expect(Object.keys(defaultConfig.modules).sort()).toEqual(
      generatorModules.map((module) => module.moduleId).sort(),
    );

    generatorModules.forEach((module) => {
      const config = defaultConfig.modules[module.moduleId];
      expect(config.templatePath).toBe(module.defaultTemplatePath);
      expect(config.excelSubject).toBe(module.excel.subject);
      expect(config.excelDestination).toBe(module.excel.destination);
      expect(config.excelColumns).toEqual(module.excel.columns);
    });
  });

  it("migrates legacy global paths into each module config", () => {
    const migrated = normalizeConfig({
      ...defaultConfig,
      defaultSaveDir: "C:/oficios",
      excelPath: "C:/controle.xlsx",
      modules: {},
    });

    generatorModules.forEach((module) => {
      expect(migrated.modules[module.moduleId].defaultSaveDir).toBe("C:/oficios");
      expect(migrated.modules[module.moduleId].excelPath).toBe("C:/controle.xlsx");
    });
  });
});
