import type { AppContext } from "../app/context";
import { MESSAGES, errorMessage } from "../app/messages";
import { generatorModules } from "../modules/registry";
import {
  deleteDraft,
  listDrafts,
  loadDraft,
  saveDraft,
} from "../services/tauri";
import { LostFoundDraftPayload, ModuleDraft } from "../types";
import { button, emptyState } from "../ui/components";
import { bindInput, escapeAttr, escapeHtml } from "../ui/dom";
import { icon } from "../ui/icons";
import { debounce } from "../ui/timing";
import { applyLostFoundDraft } from "./lost-found";

export function renderDrafts(container: HTMLElement, context: AppContext) {
  const { state } = context;
  const visibleDrafts = filterDrafts(state.drafts, state.draftsSearch);
  const rows = visibleDrafts.length
    ? visibleDrafts.map((draft) => renderDraftRow(draft, context)).join("")
    : emptyState(
        state.draftsLoading ? "Carregando rascunhos" : "Nenhum rascunho encontrado",
      );

  container.innerHTML = `
    <section class="page">
      <div class="section-title">
        <div>
          <h1>Rascunhos</h1>
          <span>Arquivos salvos por modulo.</span>
        </div>
        <label class="select-field">
          <span>Modulo</span>
          <select id="draft-filter">
            ${generatorModules
              .map(
                (module) => `
                  <option value="${escapeAttr(module.moduleId)}" ${module.moduleId === state.draftsFilter ? "selected" : ""}>
                    ${escapeHtml(module.name)}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
        <label class="field draft-search" for="draft-search">
          <span>Buscar</span>
          <input id="draft-search" value="${escapeAttr(state.draftsSearch)}" placeholder="Nome do rascunho" />
        </label>
      </div>

      <div class="list-panel fill">
        <div class="list-header">
          <strong>${icon("archive")} Arquivos salvos</strong>
          <span>${state.draftsLoading ? "..." : visibleDrafts.length}</span>
        </div>
        <div class="draft-list">${rows}</div>
      </div>
    </section>
  `;

  bindInput(container, "#draft-filter", (value) => {
    state.draftsFilter = value;
    state.draftsSearch = "";
    void refreshDrafts(context);
  });

  const searchInput = container.querySelector<HTMLInputElement>("#draft-search");
  const applySearch = debounce((value: string) => {
    state.draftsSearch = value;
    context.renderApp();
  }, 120);
  searchInput?.addEventListener("input", () => applySearch(searchInput.value));

  container.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action || "";
      const id = item.dataset.id || "";
      if (action === "open-draft") {
        void openDraft(context, id);
      } else if (action === "delete-draft") {
        void removeDraft(context, id);
      } else if (action === "rename-draft") {
        const draft = state.drafts.find((value) => value.draftId === id);
        state.renameDraftId = id;
        state.renameValue = draft?.name || "";
        context.renderApp();
      } else if (action === "confirm-rename") {
        void commitRename(context, id);
      } else if (action === "cancel-rename") {
        state.renameDraftId = null;
        state.renameValue = "";
        context.renderApp();
      }
    });
  });

  const renameInput = container.querySelector<HTMLInputElement>("#rename-draft");
  renameInput?.addEventListener("input", () => {
    state.renameValue = renameInput.value;
  });
}

export async function refreshDrafts(context: AppContext) {
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
  const needle = search.trim().toLowerCase();
  if (!needle) {
    return drafts;
  }
  return drafts.filter((draft) => draft.name.toLowerCase().includes(needle));
}

function renderDraftRow(draft: ModuleDraft, context: AppContext) {
  const id = draft.draftId || "";
  const isRenaming = context.state.renameDraftId === id;
  const date = draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("pt-BR") : "";

  return `
    <div class="draft-row">
      <div class="draft-main">
        ${
          isRenaming
            ? `<input id="rename-draft" value="${escapeAttr(context.state.renameValue)}" aria-label="Novo nome do rascunho" />`
            : `<strong>${escapeHtml(draft.name)}</strong>`
        }
        <span>${escapeHtml(date)}</span>
      </div>
      ${
        isRenaming
          ? `
            ${button("Confirmar", "check", "confirm-rename", { id, variant: "primary" })}
            ${button("Cancelar", "x", "cancel-rename", { id })}
          `
          : `
            ${button("Abrir", "folder-open", "open-draft", { id })}
            ${button("Renomear", "pencil", "rename-draft", { id })}
            ${button("Excluir", "trash-2", "delete-draft", { id, variant: "danger" })}
          `
      }
    </div>
  `;
}

async function openDraft(context: AppContext, draftId: string) {
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
  if (!window.confirm(`Excluir o rascunho "${draft.name}"?`)) {
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
