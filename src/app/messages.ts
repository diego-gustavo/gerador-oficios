export const MESSAGES = {
  confirmClearItems: "Limpar todos os itens adicionados?",
  confirmResetSettings: "Restaurar todas as configuracoes para o padrao?",
  draftDeleted: "Rascunho excluido.",
  draftLoaded: "Rascunho carregado.",
  draftRenamed: "Rascunho renomeado.",
  draftSaved: "Rascunho salvo.",
  draftSaveFailed: "Falha ao salvar rascunho.",
  draftLoadFailed: "Falha ao carregar rascunho.",
  draftDeleteFailed: "Falha ao excluir rascunho.",
  draftRenameFailed: "Falha ao renomear.",
  draftsListFailed: "Falha ao listar rascunhos.",
  generationCanceled: "Geracao cancelada.",
  generationFailed: "Falha na geracao.",
  itemRequired: "Informe o item.",
  noItems: "Nenhum item adicionado.",
  numberNotLoaded: "Numero nao carregado.",
  settingsRestored: "Configuracoes restauradas.",
  settingsRestoreFailed: "Falha ao restaurar configuracoes.",
  settingsSaved: "Configuracoes salvas.",
  settingsSaveFailed: "Falha ao salvar configuracoes.",
} as const;

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
