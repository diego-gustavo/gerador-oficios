import { LOST_FOUND_MODULE_ID, LostFoundGeneratePayload } from "../../types";
import { defaultLostFoundDocumentName, isValidBrDate } from "./format";

export const lostFoundModuleAdapter = {
  moduleId: LOST_FOUND_MODULE_ID,
  defaultDraftName: "Achados e Perdidos",
  defaultDocumentName: defaultLostFoundDocumentName,
  validate: validateLostFoundPayload,
};

export function validateLostFoundPayload(payload: LostFoundGeneratePayload) {
  if (!/^\d+\/\d{4}$/.test(payload.officioNumber)) {
    return "Número do ofício inválido.";
  }
  if (!isValidBrDate(payload.officioDate)) {
    return "Data inválida. Use dd/mm/aaaa.";
  }
  if (!payload.documentName.trim()) {
    return "Informe o nome do ofício.";
  }
  if (!payload.responsible) {
    return "Informe o responsável.";
  }
  if (payload.items.length === 0) {
    return "Adicione pelo menos um item.";
  }
  return null;
}
