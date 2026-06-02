import {
  Archive,
  Check,
  Eraser,
  FilePlus2,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Field } from "../components/Field";
import { IconButton } from "../components/IconButton";
import {
  AppConfig,
  LOST_FOUND_MODULE_ID,
  LostFoundDraftPayload,
  LostFoundItem,
  LostFoundGeneratePayload,
  ModuleDraft,
  ToastState,
} from "../types";
import {
  appendExcelRow,
  generateDocument,
  getDefaultSaveFilename,
  getNextOfficio,
  pickSaveFile,
  saveDraft,
} from "../services/tauri";
import {
  formatLostFoundItem,
  isValidBrDate,
  makeItemId,
  todayBrDate,
} from "../modules/lost-found/format";

interface LostFoundPageProps {
  config: AppConfig;
  initialDraft: ModuleDraft<LostFoundDraftPayload> | null;
  onDraftConsumed: () => void;
  onRouteChange: (route: "drafts") => void;
  showToast: (toast: ToastState) => void;
}

const currentYear = new Date().getFullYear();

export function LostFoundPage({
  config,
  initialDraft,
  onDraftConsumed,
  onRouteChange,
  showToast,
}: LostFoundPageProps) {
  const moduleConfig = config.modules[LOST_FOUND_MODULE_ID];
  const suggestions = moduleConfig?.suggestions ?? [];
  const [year, setYear] = useState(currentYear);
  const [officioNumber, setOfficioNumber] = useState(`1/${currentYear}`);
  const [loadingNumber, setLoadingNumber] = useState(false);
  const [officioDate, setOfficioDate] = useState(todayBrDate());
  const [responsible, setResponsible] = useState("");
  const [draftName, setDraftName] = useState("Achados e Perdidos");
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [marca, setMarca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [numberReload, setNumberReload] = useState(0);
  const itemInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSuggestions = useMemo(() => {
    const needle = itemName.trim().toLowerCase();
    if (!needle) {
      return suggestions;
    }
    return suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(needle),
    );
  }, [itemName, suggestions]);

  useEffect(() => {
    if (!initialDraft) {
      return;
    }
    const payload = initialDraft.payload;
    setYear(payload.year);
    setOfficioNumber(payload.officioNumber);
    setOfficioDate(payload.officioDate);
    setResponsible(payload.responsible);
    setItems(payload.items);
    setDraftName(initialDraft.name);
    setCurrentDraftId(initialDraft.draftId);
    showToast({ tone: "success", message: "Rascunho carregado." });
    onDraftConsumed();
  }, [initialDraft, onDraftConsumed, showToast]);

  useEffect(() => {
    let active = true;
    setLoadingNumber(true);
    getNextOfficio(LOST_FOUND_MODULE_ID, year)
      .then((next) => {
        if (active) {
          setOfficioNumber(next);
        }
      })
      .catch((error) => {
        if (active) {
          showToast({
            tone: "warning",
            message: error instanceof Error ? error.message : "Número não carregado.",
          });
        }
      })
      .finally(() => {
        if (active) {
          setLoadingNumber(false);
        }
      });

    return () => {
      active = false;
    };
  }, [year, config.excelPath, numberReload, showToast]);

  function resetItemForm() {
    setItemName("");
    setMarca("");
    setDescricao("");
    setEditingId(null);
    setShowSuggestions(false);
    itemInputRef.current?.focus();
  }

  function addOrUpdateItem() {
    const name = itemName.trim();
    if (!name) {
      showToast({ tone: "warning", message: "Informe o item." });
      itemInputRef.current?.focus();
      return;
    }

    const nextItem: LostFoundItem = {
      id: editingId || makeItemId(),
      item: name,
      marca: marca.trim(),
      descricao: descricao.trim(),
    };

    setItems((current) => {
      if (!editingId) {
        return [...current, nextItem];
      }
      return current.map((item) => (item.id === editingId ? nextItem : item));
    });
    resetItemForm();
  }

  function editItem(item: LostFoundItem) {
    setEditingId(item.id);
    setItemName(item.item);
    setMarca(item.marca || "");
    setDescricao(item.descricao || "");
    itemInputRef.current?.focus();
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
    if (editingId === itemId) {
      resetItemForm();
    }
  }

  function buildPayload(): LostFoundGeneratePayload {
    return {
      year,
      officioNumber,
      officioDate,
      responsible: responsible.trim(),
      items,
    };
  }

  function validatePayload(payload: LostFoundGeneratePayload) {
    if (!/^\d+\/\d{4}$/.test(payload.officioNumber)) {
      return "Número do ofício inválido.";
    }
    if (!isValidBrDate(payload.officioDate)) {
      return "Data inválida. Use dd/mm/aaaa.";
    }
    if (!payload.responsible) {
      return "Informe o responsável.";
    }
    if (payload.items.length === 0) {
      return "Adicione pelo menos um item.";
    }
    return null;
  }

  async function handleSaveDraft() {
    const payload = buildPayload();
    setBusy(true);
    try {
      const saved = await saveDraft<LostFoundDraftPayload>(LOST_FOUND_MODULE_ID, {
        draftId: currentDraftId,
        moduleId: LOST_FOUND_MODULE_ID,
        name: draftName.trim() || "Achados e Perdidos",
        payload,
      });
      setCurrentDraftId(saved.draftId);
      setDraftName(saved.name);
      showToast({ tone: "success", message: "Rascunho salvo." });
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao salvar rascunho.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    const payload = buildPayload();
    const validation = validatePayload(payload);
    if (validation) {
      showToast({ tone: "warning", message: validation });
      return;
    }

    setBusy(true);
    try {
      const defaultFileName = await getDefaultSaveFilename(payload);
      const savePath = await pickSaveFile(defaultFileName, config.defaultSaveDir);
      if (!savePath) {
        showToast({ tone: "info", message: "Geração cancelada." });
        return;
      }

      const generated = await generateDocument(LOST_FOUND_MODULE_ID, payload, savePath);
      await appendExcelRow(LOST_FOUND_MODULE_ID, payload);
      showToast({
        tone: "success",
        message: `Ofício ${generated.officioNumber} gerado e registrado.`,
      });

      setItems([]);
      setResponsible("");
      setCurrentDraftId(undefined);
      setDraftName("Achados e Perdidos");
      setOfficioNumber(await getNextOfficio(LOST_FOUND_MODULE_ID, year));
      resetItemForm();
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha na geração.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page page-grid">
      <div className="page-main">
        <div className="section-title">
          <div>
            <h1>Achados e Perdidos</h1>
            <span>Encaminhamento de itens localizados</span>
          </div>
          <IconButton
            label="Rascunhos"
            icon={<Archive size={17} />}
            onClick={() => onRouteChange("drafts")}
          />
        </div>

        <div className="toolbar">
          <div className="year-control" aria-label="Ano do ofício">
            <button type="button" onClick={() => setYear((value) => value - 1)}>
              -
            </button>
            <strong>{year}</strong>
            <button type="button" onClick={() => setYear((value) => value + 1)}>
              +
            </button>
          </div>

          <div className="number-pill">
            <span>Próximo ofício</span>
            <strong>{loadingNumber ? "Carregando..." : officioNumber}</strong>
          </div>

          <IconButton
            label="Atualizar"
            icon={<RefreshCw size={17} />}
            onClick={() => setNumberReload((value) => value + 1)}
          />
        </div>

        <div className="form-grid compact">
          <Field
            label="Data do ofício"
            value={officioDate}
            onChange={(event) => setOfficioDate(event.target.value)}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
          />
          <Field
            label="Responsável"
            value={responsible}
            onChange={(event) => setResponsible(event.target.value)}
            placeholder="Nome do responsável"
          />
          <Field
            label="Nome do rascunho"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </div>

        <div className="item-editor">
          <div className="combo-field">
            <label htmlFor="lost-found-item">Item</label>
            <input
              ref={itemInputRef}
              id="lost-found-item"
              value={itemName}
              onChange={(event) => {
                setItemName(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Cartão, RG, Óculos..."
              autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 ? (
              <div className="suggestions" role="listbox">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setItemName(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Field
            label="Marca"
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            placeholder="Opcional"
          />
          <Field
            label="Descrição"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Opcional"
          />

          <div className="item-actions">
            <IconButton
              label={editingId ? "Atualizar" : "Adicionar"}
              icon={editingId ? <Check size={17} /> : <Plus size={17} />}
              variant="primary"
              onClick={addOrUpdateItem}
            />
            {editingId ? (
              <IconButton label="Cancelar" icon={<X size={17} />} onClick={resetItemForm} />
            ) : null}
          </div>
        </div>

        <div className="list-panel">
          <div className="list-header">
            <strong>Itens adicionados</strong>
            <span>{items.length}</span>
          </div>

          {items.length === 0 ? (
            <EmptyState title="Nenhum item adicionado" />
          ) : (
            <div className="items-list">
              {items.map((item, index) => (
                <div className="item-row" key={item.id}>
                  <span className="item-index">{index + 1}</span>
                  <p>{formatLostFoundItem(item)}</p>
                  <IconButton
                    label="Editar"
                    icon={<Pencil size={16} />}
                    onClick={() => editItem(item)}
                  />
                  <IconButton
                    label="Remover"
                    icon={<Trash2 size={16} />}
                    variant="danger"
                    onClick={() => removeItem(item.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="action-rail" aria-label="Ações do gerador">
        <IconButton
          label="Salvar rascunho"
          icon={<Save size={18} />}
          onClick={handleSaveDraft}
          disabled={busy}
        />
        <IconButton
          label="Carregar"
          icon={<FolderOpen size={18} />}
          onClick={() => onRouteChange("drafts")}
          disabled={busy}
        />
        <IconButton
          label="Limpar itens"
          icon={<Eraser size={18} />}
          onClick={() => {
            setItems([]);
            resetItemForm();
          }}
          disabled={busy || items.length === 0}
        />
        <IconButton
          label="Gerar ofício"
          icon={<FilePlus2 size={18} />}
          variant="primary"
          onClick={handleGenerate}
          disabled={busy}
        />
      </aside>
    </section>
  );
}
