import type { ChangeEventHandler } from "react";
import type { AppContext } from "../app/context";
import { MESSAGES, errorMessage } from "../app/messages";
import { generatorModules } from "../modules/registry";
import {
  deleteDraft,
  listDrafts,
  loadDraft,
  saveDraft,
} from "../services/tauri";
import type { LostFoundDraftPayload, ModuleDraft } from "../types";
import { ActionButton, EmptyState, Field } from "../ui/components";
import { Icon } from "../ui/icons";
import { applyLostFoundDraft } from "./lost-found";

// Tela de rascunhos: lista, filtra, abre, renomeia e exclui drafts por módulo.
export function DraftsPage({ context }: { context: AppContext }) {
  const { state } = context;
  const visibleDrafts = filterDrafts(state.drafts, state.draftsSearch);

  const handleFilterChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    state.draftsFilter = event.currentTarget.value;
    state.draftsSearch = "";
    void refreshDrafts(context);
  };

  return (
    <section className="page">
      <div className="section-title">
        <div>
          <h1>Rascunhos</h1>
          <span>Arquivos salvos por módulo.</span>
        </div>
        <label className="select-field">
          <span>Módulo</span>
          <select id="draft-filter" value={state.draftsFilter} onChange={handleFilterChange}>
            {generatorModules.map((module) => (
              <option key={module.moduleId} value={module.moduleId}>
                {module.name}
              </option>
            ))}
          </select>
        </label>
        <Field
          id="draft-search"
          label="Buscar"
          onChange={(value) => {
            state.draftsSearch = value;
            context.renderApp();
          }}
          placeholder="Nome do rascunho"
          value={state.draftsSearch}
        />
      </div>

      <div className="list-panel fill">
        <div className="list-header">
          <strong>
            <Icon name="archive" /> Arquivos salvos
          </strong>
          <span>{state.draftsLoading ? "..." : visibleDrafts.length}</span>
        </div>
        <div className="draft-list">
          {visibleDrafts.length ? (
            visibleDrafts.map((draft) => (
              <DraftRow context={context} draft={draft} key={draft.draftId || draft.name} />
            ))
          ) : (
            <EmptyState
              title={
                state.draftsLoading ? "Carregando rascunhos" : "Nenhum rascunho encontrado"
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}

export async function refreshDrafts(context: AppContext) {
  // Mantém carregamento visível porque a lista pode vir do disco no Tauri.
  const { state } = context;
  state.draftsLoading = true;
  context.renderApp();

  try {
    state.drafts = await listDrafts(state.draftsFilter);
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.draftsListFailed),
    });
  } finally {
    state.draftsLoading = false;
    context.renderApp();
  }
}

function filterDrafts(drafts: ModuleDraft[], search: string) {
  // Busca local simples; a lista já vem filtrada por módulo.
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return drafts;
  }
  return drafts.filter((draft) => draft.name.toLowerCase().includes(needle));
}

type DraftRowProps = {
  context: AppContext;
  draft: ModuleDraft;
};

function DraftRow({ context, draft }: DraftRowProps) {
  // Uma linha alterna entre modo leitura e modo renomeação.
  const id = draft.draftId || "";
  const isRenaming = context.state.renameDraftId === id;
  const date = draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("pt-BR") : "";

  return (
    <div className="draft-row">
      <div className="draft-main">
        {isRenaming ? (
          <input
            id="rename-draft"
            aria-label="Novo nome do rascunho"
            value={context.state.renameValue}
            onChange={(event) => {
              context.state.renameValue = event.currentTarget.value;
              context.renderApp();
            }}
          />
        ) : (
          <strong>{draft.name}</strong>
        )}
        <span>{date}</span>
      </div>
      {isRenaming ? (
        <>
          <ActionButton
            iconName="check"
            label="Confirmar"
            onClick={() => void commitRename(context, id)}
            variant="primary"
          />
          <ActionButton
            iconName="x"
            label="Cancelar"
            onClick={() => {
              context.state.renameDraftId = null;
              context.state.renameValue = "";
              context.renderApp();
            }}
          />
        </>
      ) : (
        <>
          <ActionButton
            iconName="folder-open"
            label="Abrir"
            onClick={() => void openDraft(context, id)}
          />
          <ActionButton
            iconName="pencil"
            label="Renomear"
            onClick={() => {
              context.state.renameDraftId = id;
              context.state.renameValue = draft.name;
              context.renderApp();
            }}
          />
          <ActionButton
            iconName="trash-2"
            label="Excluir"
            onClick={() => void removeDraft(context, id)}
            variant="danger"
          />
        </>
      )}
    </div>
  );
}

async function openDraft(context: AppContext, draftId: string) {
  // Hoje só existe Achados e Perdidos; novos módulos devem despachar pelo moduleId.
  const draft = context.state.drafts.find((value) => value.draftId === draftId);
  if (!draft?.draftId) {
    return;
  }

  try {
    const loaded = await loadDraft<LostFoundDraftPayload>(draft.moduleId, draft.draftId);
    applyLostFoundDraft(context, loaded);
    context.navigate("lost-found");
    context.showToast({ tone: "success", message: MESSAGES.draftLoaded });
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.draftLoadFailed),
    });
  }
}

async function removeDraft(context: AppContext, draftId: string) {
  const draft = context.state.drafts.find((value) => value.draftId === draftId);
  if (!draft?.draftId) {
    return;
  }
  const accepted = await context.confirm({
    title: "Excluir rascunho",
    message: `Excluir o rascunho "${draft.name}"?`,
    confirmLabel: "Excluir",
    tone: "danger",
  });
  if (!accepted) {
    return;
  }

  try {
    await deleteDraft(draft.moduleId, draft.draftId);
    context.showToast({ tone: "success", message: MESSAGES.draftDeleted });
    await refreshDrafts(context);
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.draftDeleteFailed),
    });
  }
}

async function commitRename(context: AppContext, draftId: string) {
  // Renomear reaproveita saveDraft para preservar formato e updatedAt.
  const { state } = context;
  const draft = state.drafts.find((value) => value.draftId === draftId);
  if (!draft?.draftId) {
    return;
  }

  try {
    await saveDraft(draft.moduleId, {
      ...draft,
      name: state.renameValue.trim() || draft.name,
    });
    state.renameDraftId = null;
    state.renameValue = "";
    context.showToast({ tone: "success", message: MESSAGES.draftRenamed });
    await refreshDrafts(context);
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.draftRenameFailed),
    });
  }
}
