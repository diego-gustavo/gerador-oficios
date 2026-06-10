import { useMemo, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
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
import type {
  LostFoundDraftPayload,
  LostFoundGeneratePayload,
  LostFoundItem,
  ModuleDraft,
} from "../types";
import { LOST_FOUND_MODULE_ID } from "../types";
import { ActionButton, EmptyState, Field } from "../ui/components";
import { Icon } from "../ui/icons";
import { GeneratorPage } from "./generator-shell";

// Tela principal do módulo: concentra formulário, sugestões, rascunho e geração.
export function LostFoundPage({ context }: { context: AppContext }) {
  const { state } = context;
  const lostFound = state.lostFound;
  const dateInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  if (!lostFound.documentName) {
    syncDocumentName(context);
  }

  const canClear = lostFound.items.length > 0 && !lostFound.busy;
  const datePickerValue = brDateToIso(lostFound.officioDate);
  const lockLabel = lostFound.documentNameLocked
    ? "Liberar edição do nome do ofício"
    : "Bloquear e restaurar nome padrão";
  const suggestions = useMemo(() => {
    // Sugestões são filtradas em memória para resposta imediata durante digitação.
    const values = state.config.modules[LOST_FOUND_MODULE_ID]?.suggestions || [];
    const needle = lostFound.itemName.trim().toLowerCase();
    return (needle
      ? values.filter((item) => item.toLowerCase().includes(needle))
      : values
    ).slice(0, 80);
  }, [lostFound.itemName, state.config.modules]);

  const focusItem = () => {
    window.setTimeout(() => itemInputRef.current?.focus(), 0);
  };

  const handleItemEnter: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("lf-marca")?.focus();
    }
  };

  return (
    <GeneratorPage
      title="Achados e Perdidos"
      subtitle="Encaminhamento de itens localizados."
      secondaryActions={
        <>
          <ActionButton
            disabled={lostFound.busy}
            iconName="save"
            label="Salvar rascunho"
            onClick={() => void handleSaveDraft(context)}
          />
          <ActionButton
            disabled={lostFound.busy}
            iconName="folder-open"
            label="Carregar rascunho"
            onClick={() => context.navigate("drafts")}
          />
          <ActionButton
            disabled={!canClear}
            iconName="eraser"
            label="Limpar itens"
            onClick={() => clearItems(context)}
          />
        </>
      }
      primaryAction={
        <ActionButton
          disabled={lostFound.busy}
          iconName="file-plus-2"
          label="Gerar ofício"
          onClick={() => void handleGenerate(context)}
          variant="primary"
        />
      }
    >
      <div className="toolbar">
        <div className="year-control" aria-label="Ano do ofício">
          <button
            type="button"
            onClick={() => {
              lostFound.year -= 1;
              lostFound.officioNumber = `1/${lostFound.year}`;
              syncDocumentName(context);
              void refreshNextOfficio(context);
            }}
          >
            -
          </button>
          <strong>{lostFound.year}</strong>
          <button
            type="button"
            onClick={() => {
              lostFound.year += 1;
              lostFound.officioNumber = `1/${lostFound.year}`;
              syncDocumentName(context);
              void refreshNextOfficio(context);
            }}
          >
            +
          </button>
        </div>
        <div className="number-pill">
          <span>Próximo ofício</span>
          <strong>{lostFound.loadingNumber ? "Carregando..." : lostFound.officioNumber}</strong>
        </div>
        <ActionButton
          disabled={lostFound.loadingNumber}
          iconName="refresh-cw"
          label="Atualizar"
          onClick={() => void refreshNextOfficio(context, { force: true })}
        />
      </div>

      <div className="form-grid compact">
        <Field
          id="lf-date"
          inputMode="numeric"
          label="Data do ofício"
          onChange={(value) => {
            lostFound.officioDate = value;
            context.renderApp();
          }}
          placeholder="dd/mm/aaaa"
          value={lostFound.officioDate}
        >
          <div className="input-with-button date-input-group">
            <input
              id="lf-date"
              inputMode="numeric"
              onChange={(event) => {
                lostFound.officioDate = event.currentTarget.value;
                context.renderApp();
              }}
              placeholder="dd/mm/aaaa"
              value={lostFound.officioDate}
            />
            <button
              type="button"
              className="field-icon-button"
              aria-label="Abrir calendário"
              title="Abrir calendário"
              onClick={() => openNativeDatePicker(dateInputRef.current, context)}
            >
              <Icon name="calendar-days" />
            </button>
            <input
              ref={dateInputRef}
              id="lf-date-native"
              className="native-date-input"
              type="date"
              value={datePickerValue}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const value = isoDateToBr(event.currentTarget.value);
                if (value) {
                  lostFound.officioDate = value;
                  context.renderApp();
                }
              }}
            />
          </div>
        </Field>
        <Field
          id="lf-responsible"
          label="Responsável"
          onChange={(value) => {
            lostFound.responsible = value;
            context.renderApp();
          }}
          placeholder="Nome do responsável"
          value={lostFound.responsible}
        />
        <Field
          id="lf-document-name"
          label="Nome do ofício"
          onChange={(value) => {
            if (!lostFound.documentNameLocked) {
              lostFound.documentName = value;
              context.renderApp();
            }
          }}
          placeholder="Nome do ofício"
          value={lostFound.documentName}
        >
          <div className="input-with-button lock-input-group">
            <input
              id="lf-document-name"
              onChange={(event) => {
                if (!lostFound.documentNameLocked) {
                  lostFound.documentName = event.currentTarget.value;
                  context.renderApp();
                }
              }}
              placeholder="Nome do ofício"
              readOnly={lostFound.documentNameLocked}
              value={lostFound.documentName}
            />
            <button
              type="button"
              className="field-icon-button"
              aria-label={lockLabel}
              title={lockLabel}
              onClick={() => toggleDocumentNameLock(context)}
            >
              <Icon name={lostFound.documentNameLocked ? "lock" : "lock-open"} />
            </button>
          </div>
        </Field>
        <Field
          id="lf-draft-name"
          label="Nome do rascunho"
          onChange={(value) => {
            lostFound.draftName = value;
            context.renderApp();
          }}
          value={lostFound.draftName}
        />
      </div>

      <div className="item-editor">
        <div
          className="combo-field"
          id="item-combo"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSuggestionsOpen(false);
            }
          }}
        >
          <label htmlFor="lf-item">Item</label>
          <input
            ref={itemInputRef}
            id="lf-item"
            autoComplete="off"
            onChange={(event) => {
              lostFound.itemName = event.currentTarget.value;
              setSuggestionsOpen(true);
              context.renderApp();
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={handleItemEnter}
            placeholder="Cartão, RG, Óculos..."
            value={lostFound.itemName}
          />
          <div className="suggestions" id="suggestions" hidden={!suggestionsOpen || !suggestions.length}>
            {suggestions.map((value) => (
              <button
                key={value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  lostFound.itemName = value;
                  setSuggestionsOpen(false);
                  context.renderApp();
                  window.setTimeout(() => document.getElementById("lf-marca")?.focus(), 0);
                }}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <Field
          id="lf-marca"
          label="Marca"
          onChange={(value) => {
            lostFound.marca = value;
            context.renderApp();
          }}
          placeholder="Opcional"
          value={lostFound.marca}
        />
        <Field
          id="lf-descricao"
          label="Descrição"
          onChange={(value) => {
            lostFound.descricao = value;
            context.renderApp();
          }}
          placeholder="Opcional"
          value={lostFound.descricao}
        />
        <Field
          id="lf-observacao"
          label="Observação"
          onChange={(value) => {
            lostFound.observacao = value;
            context.renderApp();
          }}
          placeholder="Opcional"
          value={lostFound.observacao}
        />
        <div className="item-actions">
          <ActionButton
            iconName={lostFound.editingId ? "check" : "plus"}
            label={lostFound.editingId ? "Atualizar" : "Adicionar"}
            onClick={() => {
              addOrUpdateItem(context);
              focusItem();
            }}
            variant="primary"
          />
          {lostFound.editingId ? (
            <ActionButton
              iconName="x"
              label="Cancelar"
              onClick={() => {
                resetItemForm(context);
                context.renderApp();
                focusItem();
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="list-panel">
        <div className="list-header">
          <strong>Itens adicionados</strong>
          <span>{lostFound.items.length}</span>
        </div>
        <div className="items-list">
          {lostFound.items.length ? (
            lostFound.items.map((item, index) => (
              <ItemRow context={context} item={item} index={index} key={item.id} />
            ))
          ) : (
            <EmptyState
              title="Nenhum item adicionado"
              text="Informe item, marca, descrição e observação quando houver."
            />
          )}
        </div>
      </div>
    </GeneratorPage>
  );
}

type ItemRowProps = {
  context: AppContext;
  index: number;
  item: LostFoundItem;
};

function ItemRow({ context, index, item }: ItemRowProps) {
  return (
    <div className="item-row">
      <span className="item-index">{index + 1}</span>
      <p>{formatLostFoundItem(item)}</p>
      <ActionButton
        iconName="pencil"
        label="Editar"
        onClick={() => editItem(context, item.id)}
      />
      <ActionButton
        iconName="trash-2"
        label="Remover"
        onClick={() => removeItem(context, item.id)}
        variant="danger"
      />
    </div>
  );
}

export async function refreshNextOfficio(
  context: AppContext,
  options: { force?: boolean } = {},
) {
  // Cache evita reler a planilha a cada renderização ou troca rápida de rota.
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
  // Rascunhos antigos podem não ter documentNameLocked; default mantém padrão seguro.
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
  const moduleConfig = context.state.config.modules[LOST_FOUND_MODULE_ID];
  return [
    LOST_FOUND_MODULE_ID,
    moduleConfig?.excelPath.trim() || "",
    year,
  ].join("|");
}

function invalidateNextOfficioCache(context: AppContext) {
  context.state.nextOfficioCache = {};
}

function syncDocumentName(context: AppContext) {
  // Nome automático só muda quando usuário não liberou edição manual.
  const lostFound = context.state.lostFound;
  if (!lostFound.documentNameLocked) {
    return;
  }
  lostFound.documentName = defaultLostFoundDocumentName(
    lostFound.year,
    lostFound.officioNumber,
  );
}

function openNativeDatePicker(
  picker: (HTMLInputElement & { showPicker?: () => void }) | null,
  context: AppContext,
) {
  // showPicker existe nos navegadores modernos; fallback cobre WebView antiga.
  if (!picker) {
    return;
  }

  const currentValue = brDateToIso(context.state.lostFound.officioDate);
  if (currentValue) {
    picker.value = currentValue;
  }

  if (picker.showPicker) {
    picker.showPicker();
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
    window.setTimeout(() => document.getElementById("lf-document-name")?.focus(), 0);
  }
}

function addOrUpdateItem(context: AppContext) {
  // O mesmo formulário serve para inclusão e edição pelo editingId.
  const { state } = context;
  const lostFound = state.lostFound;
  const itemName = lostFound.itemName.trim();
  if (!itemName) {
    context.showToast({ tone: "warning", message: MESSAGES.itemRequired });
    window.setTimeout(() => document.getElementById("lf-item")?.focus(), 0);
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
  window.setTimeout(() => document.getElementById("lf-item")?.focus(), 0);
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
  // Payload final remove espaços e garante nome de documento preenchido.
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
  // Ordem importa: gerar DOCX primeiro, registrar Excel depois, limpar só no sucesso.
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
    const moduleConfig = state.config.modules[LOST_FOUND_MODULE_ID];
    const savePath = await pickSaveFile(defaultFileName, moduleConfig?.defaultSaveDir);
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
      message: `Ofício ${generated.officioNumber} gerado e registrado.`,
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
