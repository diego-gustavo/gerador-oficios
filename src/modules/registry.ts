import { GeneratorModule, LOST_FOUND_MODULE_ID } from "../types";

export const generatorModules: GeneratorModule[] = [
  {
    moduleId: LOST_FOUND_MODULE_ID,
    name: "Achados e Perdidos",
    shortName: "Achados",
    route: "lost-found",
    description: "Encaminhamento de itens localizados para registro oficial.",
    templateTags: ["{{DATA}}", "{{OFICIO}}", "{{LISTA_ITENS}}"],
  },
];

export function getModule(moduleId: string) {
  return generatorModules.find((module) => module.moduleId === moduleId);
}
