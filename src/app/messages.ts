// Mensagens centralizadas evitam textos divergentes entre telas e ações assíncronas.
export const MESSAGES = {
  confirmClearItems: "Limpar todos os itens adicionados?",
  confirmResetSettings: "Restaurar todas as configurações para o padrão?",
  draftDeleted: "Rascunho excluído.",
  draftLoaded: "Rascunho carregado.",
  draftRenamed: "Rascunho renomeado.",
  draftSaved: "Rascunho salvo.",
  draftSaveFailed: "Falha ao salvar rascunho.",
  draftLoadFailed: "Falha ao carregar rascunho.",
  draftDeleteFailed: "Falha ao excluir rascunho.",
  draftRenameFailed: "Falha ao renomear.",
  draftsListFailed: "Falha ao listar rascunhos.",
  generationCanceled: "Geração cancelada.",
  generationFailed: "Falha na geração.",
  itemRequired: "Informe o item.",
  noItems: "Nenhum item adicionado.",
  numberNotLoaded: "Número não carregado.",
  settingsRestored: "Configurações restauradas.",
  settingsRestoreFailed: "Falha ao restaurar configurações.",
  settingsSaved: "Configurações salvas.",
  settingsSaveFailed: "Falha ao salvar configurações.",
} as const;

export function errorMessage(error: unknown, fallback: string) {
  // Comandos Tauri normalmente retornam Error; fallback cobre respostas inesperadas.
  return error instanceof Error ? error.message : fallback;
}
