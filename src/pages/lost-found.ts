import type { AppContext } from "../app/context";
import { measureAsync } from "../app/logger";
import { MESSAGES, errorMessage } from "../app/messages";
import { createLostFoundState } from "../app/state";
import {
  brDateToIso,
  defaultLostFoundDocumentName,
  formatLostFoundItem,
  isoDateToBr,
  makeItemId,
} from "../modules/lost-found/format";
import { validateLostFoundPayload } from "../modules/lost-found/module";
import {
  appendExcelRow,
  generateDocument,
  getDefaultSaveFilename,
  getNextOfficio,
  pickSaveFile,
  saveDraft,
} from "../services/tauri";
import {
  LOST_FOUND_MODULE_ID,
  LostFoundDraftPayload,
  LostFoundGeneratePayload,
  LostFoundItem,
  ModuleDraft,
} from "../types";
import { button, emptyState, field } from "../ui/components";
import { bindInput, escapeAttr, escapeHtml, query } from "../ui/dom";
import { icon } from "../ui/icons";
import { debounce } from "../ui/timing";
import { renderGeneratorPage } from "./generator-shell";

export function renderLostFound(container: HTMLElement, context: AppContext) {
  const { state } = context;
  const lostFound = state.lostFound;
  if (!lostFound.documentName) {
    syncDocumentName(context);
  }

  const canClear = lostFound.items.length > 0 && !lostFound.busy;
  const datePickerValue = brDateToIso(lostFound.officioDate);
  const lockLabel = lostFound.documentNameLocked
    ? "Liberar edicao do nome do oficio"
    : "Bloquear e restaurar nome padrao";
  const itemRows = lostFound.items.length
    ? lostFound.items
        .map(
          (item, index) => `
            <div class="item-row">
              <span class="item-index">${index + 1}</span>
              <p>${escapeHtml(formatLostFoundItem(item))}</p>
              ${button("Editar", "pencil", "edit-item", { id: item.id })}
              ${button("Remover", "trash-2", "remove-item", { id: item.id, variant: "danger" })}
            </div>
          `,
        )
        .join("")
    : emptyState(
        "Nenhum item adicionado",
        "Informe item, marca, descricao e observacao quando houver.",
      );

  const content = `
        <div class="toolbar">
          <div class="year-control" aria-label="Ano do oficio">
            <button type="button" data-action="year-down">-</button>
            <strong>${lostFound.year}</strong>
            <button type="button" data-action="year-up">+</button>
          </div>
          <div class="number-pill">
            <span>Proximo oficio</span>
            <strong>${lostFound.loadingNumber ? "Carregando..." : escapeHtml(lostFound.officioNumber)}</strong>
          </div>
          ${button("Atualizar", "refresh-cw", "refresh-number", {
            disabled: lostFound.loadingNumber,
          })}
        </div>

        <div class="form-grid compact">
          <label class="field" for="lf-date">
            <span>Data do oficio</span>
            <div class="input-with-button date-input-group">
              <input id="lf-date" value="${escapeAttr(lostFound.officioDate)}" placeholder="dd/mm/aaaa" inputmode="numeric" />
              <button type="button" class="field-icon-button" data-action="pick-date" aria-label="Abrir calendario" title="Abrir calendario">
                ${icon("calendar-days")}
              </button>
              <input id="lf-date-native" class="native-date-input" type="date" value="${escapeAttr(datePickerValue)}" tabindex="-1" aria-hidden="true" />
            </div>
          </label>
          ${field("Responsavel", "lf-responsible", lostFound.responsible, "Nome do responsavel")}
          <label class="field" for="lf-document-name">
            <span>Nome do oficio</span>
            <div class="input-with-button lock-input-group">
              <input id="lf-document-name" value="${escapeAttr(lostFound.documentName)}" placeholder="Nome do oficio" ${lostFound.documentNameLocked ? "readonly" : ""} />
              <button type="button" class="field-icon-button" data-action="toggle-document-name-lock" aria-label="${escapeAttr(lockLabel)}" title="${escapeAttr(lockLabel)}">
                ${icon(lostFound.documentNameLocked ? "lock" : "lock-open")}
              </button>
            </div>
          </label>
          ${field("Nome do rascunho", "lf-draft-name", lostFound.draftName)}
        </div>

        <div class="item-editor">
          <div class="combo-field" id="item-combo">
            <label for="lf-item">Item</label>
            <input id="lf-item" value="${escapeAttr(lostFound.itemName)}" placeholder="Cartao, RG, Oculos..." autocomplete="off" />
            <div class="suggestions" id="suggestions" hidden></div>
          </div>
          ${field("Marca", "lf-marca", lostFound.marca, "Opcional")}
          ${field("Descricao", "lf-descricao", lostFound.descricao, "Opcional")}
          ${field("Observacao", "lf-observacao", lostFound.observacao, "Opcional")}
          <div class="item-actions">
            ${button(lostFound.editingId ? "Atualizar" : "Adicionar", lostFound.editingId ? "check" : "plus", "add-item", {
              variant: "primary",
            })}
            ${lostFound.editingId ? button("Cancelar", "x", "cancel-edit") : ""}
          </div>
        </div>

        <div class="list-panel">
          <div class="list-header">
            <strong>Itens adicionados</strong>
            <span>${lostFound.items.length}</span>
          </div>
          <div class="items-list">${itemRows}</div>
        </div>
  `;

  container.innerHTML = renderGeneratorPage({
    title: "Achados e Perdidos",
    subtitle: "Encaminhamento de itens localizados.",
    content,
    secondaryActions: `
      ${button("Salvar rascunho", "save", "save-draft", { disabled: lostFound.busy })}
      ${button("Carregar rascunho", "folder-open", "open-drafts", { disabled: lostFound.busy })}
      ${button("Limpar itens", "eraser", "clear-items", { disabled: !canClear })}
    `,
    primaryAction: button("Gerar oficio", "file-plus-2", "generate", {
      variant: "primary",
      disabled: lostFound.busy,
    }),
  });

  bindInput(container, "#lf-date", (value) => {
    state.lostFound.officioDate = value;
  });
  bindInput(container, "#lf-responsible", (value) => {
    state.lostFound.responsible = value;
  });
  bindInput(container, "#lf-document-name", (value) => {
    if (!state.lostFound.documentNameLocked) {
      state.lostFound.documentName = value;
    }
  });
  bindInput(container, "#lf-draft-name", (value) => {
    state.lostFound.draftName = value;
  });
  bindInput(container, "#lf-marca", (value) => {
    state.lostFound.marca = value;
  });
  bindInput(container, "#lf-descricao", (value) => {
    state.lostFound.descricao = value;
  });
  bindInput(container, "#lf-observacao", (value) => {
    state.lostFound.observacao = value;
  });

  query<HTMLInputElement>("#lf-date-native", container).addEventListener("change", (event) => {
    const value = isoDateToBr((event.currentTarget as HTMLInputElement).value);
    if (value) {
      state.lostFound.officioDate = value;
      context.renderApp();
    }
  });

  wireLostFoundSuggestions(container, context);
  wireLostFoundActions(container, context);
}

export async function refreshNextOfficio(
  context: AppContext,
  options: { force?: boolean } = {},
) {
  const { state } = context;
  const lostFound = state.lostFound;
  const year = lostFound.year;
  const cacheKey = nextOfficioCacheKey(context, year);
  const cached = state.nextOfficioCache[cacheKey];

  if (!options.force && cached) {
    lostFound.officioNumber = cached.value;
    syncDocumentName(context);
    context.renderApp();
    return;
  }

  lostFound.loadingNumber = true;
  context.renderApp();

  try {
    const next = await measureAsync("get_next_officio", () =>
      getNextOfficio(LOST_FOUND_MODULE_ID, year),
    );
    if (state.lostFound.year === year) {
      state.lostFound.officioNumber = next;
      state.nextOfficioCache[cacheKey] = {
        value: next,
        loadedAt: Date.now(),
      };
      syncDocumentName(context);
    }
  } catch (error) {
    context.showToast({
      tone: "warning",
      message: errorMessage(error, MESSAGES.numberNotLoaded),
    });
  } finally {
    if (state.lostFound.year === year) {
      state.lostFound.loadingNumber = false;
      context.renderApp();
    }
  }
}

export function applyLostFoundDraft(
  context: AppContext,
  draft: ModuleDraft<LostFoundDraftPayload>,
) {
  context.state.lostFound = {
    ...createLostFoundState(),
    ...draft.payload,
    currentDraftId: draft.draftId,
    draftName: draft.name,
  };
  if (typeof context.state.lostFound.documentNameLocked !== "boolean") {
    context.state.lostFound.documentNameLocked = true;
  }
  if (!context.state.lostFound.documentName) {
    syncDocumentName(context);
  }
}

function nextOfficioCacheKey(context: AppContext, year: number) {
  return [
    LOST_FOUND_MODULE_ID,
    context.state.config.excelPath.trim(),
    year,
  ].join("|");
}

function invalidateNextOfficioCache(context: AppContext) {
  context.state.nextOfficioCache = {};
}

function wireLostFoundSuggestions(container: HTMLElement, context: AppContext) {
  const { state } = context;
  const input = query<HTMLInputElement>("#lf-item", container);
  const panel = query<HTMLDivElement>("#suggestions", container);
  const combo = query<HTMLDivElement>("#item-combo", container);

  function matches() {
    const suggestions = state.config.modules[LOST_FOUND_MODULE_ID]?.suggestions || [];
    const needle = state.lostFound.itemName.trim().toLowerCase();
    return (needle
      ? suggestions.filter((item) => item.toLowerCase().includes(needle))
      : suggestions
    ).slice(0, 80);
  }

  function renderSuggestions() {
    const values = matches();
    panel.hidden = values.length === 0;
    panel.innerHTML = "";

    values.forEach((value) => {
      const option = document.createElement("button");
      option.type = "button";
      option.textContent = value;
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("click", () => {
        state.lostFound.itemName = value;
        input.value = value;
        panel.hidden = true;
        query<HTMLInputElement>("#lf-marca", container).focus();
      });
      panel.append(option);
    });
  }
  const renderSuggestionsDebounced = debounce(renderSuggestions, 90);

  input.addEventListener("input", () => {
    state.lostFound.itemName = input.value;
    renderSuggestionsDebounced();
  });
  input.addEventListener("focus", renderSuggestions);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      query<HTMLInputElement>("#lf-marca", container).focus();
    }
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!combo.contains(event.target as Node)) {
        panel.hidden = true;
      }
    },
    { once: true },
  );
}

function syncDocumentName(context: AppContext) {
  const lostFound = context.state.lostFound;
  if (!lostFound.documentNameLocked) {
    return;
  }
  lostFound.documentName = defaultLostFoundDocumentName(
    lostFound.year,
    lostFound.officioNumber,
  );
}

function openNativeDatePicker(container: HTMLElement, context: AppContext) {
  const picker = query<HTMLInputElement>("#lf-date-native", container);
  const pickerWithShow = picker as HTMLInputElement & { showPicker?: () => void };
  const currentValue = brDateToIso(context.state.lostFound.officioDate);
  if (currentValue) {
    picker.value = currentValue;
  }

  if (pickerWithShow.showPicker) {
    pickerWithShow.showPicker();
  } else {
    picker.focus();
    picker.click();
  }
}

function toggleDocumentNameLock(context: AppContext) {
  const lostFound = context.state.lostFound;
  lostFound.documentNameLocked = !lostFound.documentNameLocked;
  if (lostFound.documentNameLocked) {
    syncDocumentName(context);
  }

  context.renderApp();

  if (!context.state.lostFound.documentNameLocked) {
    query<HTMLInputElement>("#lf-document-name").focus();
  }
}

function wireLostFoundActions(container: HTMLElement, context: AppContext) {
  container.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action || "";
      const id = item.dataset.id || "";

      if (action === "open-drafts") {
        context.navigate("drafts");
      } else if (action === "year-down") {
        context.state.lostFound.year -= 1;
        context.state.lostFound.officioNumber = `1/${context.state.lostFound.year}`;
        syncDocumentName(context);
        void refreshNextOfficio(context);
      } else if (action === "year-up") {
        context.state.lostFound.year += 1;
        context.state.lostFound.officioNumber = `1/${context.state.lostFound.year}`;
        syncDocumentName(context);
        void refreshNextOfficio(context);
      } else if (action === "refresh-number") {
        void refreshNextOfficio(context, { force: true });
      } else if (action === "pick-date") {
        openNativeDatePicker(container, context);
      } else if (action === "toggle-document-name-lock") {
        toggleDocumentNameLock(context);
      } else if (action === "add-item") {
        addOrUpdateItem(context);
      } else if (action === "cancel-edit") {
        resetItemForm(context);
        context.renderApp();
      } else if (action === "edit-item") {
        editItem(context, id);
      } else if (action === "remove-item") {
        removeItem(context, id);
      } else if (action === "clear-items") {
        clearItems(context);
      } else if (action === "save-draft") {
        void handleSaveDraft(context);
      } else if (action === "generate") {
        void handleGenerate(context);
      }
    });
  });
}

function addOrUpdateItem(context: AppContext) {
  const { state } = context;
  const lostFound = state.lostFound;
  const itemName = lostFound.itemName.trim();
  if (!itemName) {
    context.showToast({ tone: "warning", message: MESSAGES.itemRequired });
    query<HTMLInputElement>("#lf-item").focus();
    return;
  }

  const nextItem: LostFoundItem = {
    id: lostFound.editingId || makeItemId(),
    item: itemName,
    marca: lostFound.marca.trim(),
    descricao: lostFound.descricao.trim(),
    observacao: lostFound.observacao.trim(),
  };

  if (lostFound.editingId) {
    lostFound.items = lostFound.items.map((item) =>
      item.id === lostFound.editingId ? nextItem : item,
    );
  } else {
    lostFound.items = [...lostFound.items, nextItem];
  }

  resetItemForm(context);
  context.renderApp();
  query<HTMLInputElement>("#lf-item").focus();
}

function editItem(context: AppContext, id: string) {
  const item = context.state.lostFound.items.find((value) => value.id === id);
  if (!item) {
    return;
  }
  context.state.lostFound.editingId = item.id;
  context.state.lostFound.itemName = item.item;
  context.state.lostFound.marca = item.marca || "";
  context.state.lostFound.descricao = item.descricao || "";
  context.state.lostFound.observacao = item.observacao || "";
  context.renderApp();
  query<HTMLInputElement>("#lf-item").focus();
}

function removeItem(context: AppContext, id: string) {
  const { state } = context;
  state.lostFound.items = state.lostFound.items.filter((item) => item.id !== id);
  if (state.lostFound.editingId === id) {
    resetItemForm(context);
  }
  context.renderApp();
}

function clearItems(context: AppContext) {
  if (!context.state.lostFound.items.length) {
    return;
  }
  if (!window.confirm(MESSAGES.confirmClearItems)) {
    return;
  }
  context.state.lostFound.items = [];
  resetItemForm(context);
  context.renderApp();
}

function resetItemForm(context: AppContext) {
  context.state.lostFound.itemName = "";
  context.state.lostFound.marca = "";
  context.state.lostFound.descricao = "";
  context.state.lostFound.observacao = "";
  context.state.lostFound.editingId = null;
}

function buildLostFoundPayload(context: AppContext): LostFoundGeneratePayload {
  const lostFound = context.state.lostFound;
  return {
    year: lostFound.year,
    officioNumber: lostFound.officioNumber,
    officioDate: lostFound.officioDate,
    documentName:
      lostFound.documentName.trim() ||
      defaultLostFoundDocumentName(lostFound.year, lostFound.officioNumber),
    responsible: lostFound.responsible.trim(),
    items: lostFound.items,
  };
}

function buildLostFoundDraftPayload(context: AppContext): LostFoundDraftPayload {
  return {
    ...buildLostFoundPayload(context),
    documentNameLocked: context.state.lostFound.documentNameLocked,
  };
}

async function handleSaveDraft(context: AppContext) {
  const { state } = context;
  if (!state.lostFound.items.length) {
    context.showToast({ tone: "info", message: MESSAGES.noItems });
    return;
  }

  state.lostFound.busy = true;
  context.renderApp();

  try {
    const saved = await saveDraft<LostFoundDraftPayload>(LOST_FOUND_MODULE_ID, {
      draftId: state.lostFound.currentDraftId,
      moduleId: LOST_FOUND_MODULE_ID,
      name: state.lostFound.draftName.trim() || "Achados e Perdidos",
      payload: buildLostFoundDraftPayload(context),
    });

    state.lostFound.currentDraftId = saved.draftId;
    state.lostFound.draftName = saved.name;
    context.showToast({ tone: "success", message: MESSAGES.draftSaved });
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.draftSaveFailed),
    });
  } finally {
    state.lostFound.busy = false;
    context.renderApp();
  }
}

async function handleGenerate(context: AppContext) {
  const { state } = context;
  const payload = buildLostFoundPayload(context);
  const validation = validateLostFoundPayload(payload);
  if (validation) {
    context.showToast({ tone: "warning", message: validation });
    return;
  }

  state.lostFound.busy = true;
  context.renderApp();

  try {
    const defaultFileName = await getDefaultSaveFilename(payload);
    const savePath = await pickSaveFile(defaultFileName, state.config.defaultSaveDir);
    if (!savePath) {
      context.showToast({ tone: "info", message: MESSAGES.generationCanceled });
      return;
    }

    const generated = await measureAsync("generate_document", () =>
      generateDocument(LOST_FOUND_MODULE_ID, payload, savePath),
    );
    await measureAsync("append_excel_row", () =>
      appendExcelRow(LOST_FOUND_MODULE_ID, payload),
    );

    invalidateNextOfficioCache(context);
    state.lostFound.items = [];
    state.lostFound.responsible = "";
    state.lostFound.documentNameLocked = true;
    state.lostFound.currentDraftId = undefined;
    state.lostFound.draftName = "Achados e Perdidos";
    resetItemForm(context);

    context.showToast({
      tone: "success",
      message: `Oficio ${generated.officioNumber} gerado e registrado.`,
    });
    await refreshNextOfficio(context);
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.generationFailed),
    });
  } finally {
    state.lostFound.busy = false;
    context.renderApp();
  }
}
