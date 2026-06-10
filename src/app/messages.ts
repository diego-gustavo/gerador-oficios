// Mensagens centralizadas evitam textos divergentes entre telas e ações assíncronas.
export const MESSAGES = {
  confirmClearItems: "Limpar todos os itens adicionados?",
  confirmResetSettings: "Restaurar todas as configurações para o padrão?",
  draftDeleted: "Rascunho excluído.",
  draftLoaded: "Rascunho carregado.",
  draftRenamed: "Rascunho renomeado.",
  draftSaved: "Rascunho salvo.",
  draftSaveFailed: "Não foi possível salvar o rascunho.",
  draftLoadFailed: "Não foi possível carregar o rascunho.",
  draftDeleteFailed: "Não foi possível excluir o rascunho.",
  draftRenameFailed: "Não foi possível renomear o rascunho.",
  draftsListFailed: "Não foi possível listar os rascunhos.",
  generationCanceled: "Geração cancelada.",
  generationFailed: "Não foi possível gerar o ofício.",
  itemRequired: "Informe o nome do item.",
  noItems: "Adicione pelo menos um item antes de continuar.",
  numberNotLoaded: "Não foi possível carregar o próximo número.",
  settingsRestored: "Configurações restauradas.",
  settingsRestoreFailed: "Não foi possível restaurar as configurações.",
  settingsSaved: "Configurações salvas.",
  settingsSaveFailed: "Não foi possível salvar as configurações.",
} as const;

export function errorMessage(error: unknown, fallback: string) {
  // Comandos Tauri podem rejeitar com string; mostrar esse detalhe ajuda a operação.
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }
  return fallback;
}
