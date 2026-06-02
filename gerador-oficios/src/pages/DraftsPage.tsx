import { Archive, Check, FolderOpen, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { IconButton } from "../components/IconButton";
import { generatorModules } from "../modules/registry";
import {
  LOST_FOUND_MODULE_ID,
  LostFoundDraftPayload,
  ModuleDraft,
  ToastState,
} from "../types";
import { deleteDraft, listDrafts, loadDraft, saveDraft } from "../services/tauri";

interface DraftsPageProps {
  onOpenLostFoundDraft: (draft: ModuleDraft<LostFoundDraftPayload>) => void;
  showToast: (toast: ToastState) => void;
}

export function DraftsPage({ onOpenLostFoundDraft, showToast }: DraftsPageProps) {
  const [moduleFilter, setModuleFilter] = useState(LOST_FOUND_MODULE_ID);
  const [drafts, setDrafts] = useState<ModuleDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filteredModules = useMemo(() => generatorModules, []);

  async function refreshDrafts() {
    setLoading(true);
    try {
      setDrafts(await listDrafts(moduleFilter));
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao listar rascunhos.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDrafts();
  }, [moduleFilter]);

  async function openDraft(draft: ModuleDraft) {
    if (!draft.draftId) {
      return;
    }
    try {
      const loaded = await loadDraft<LostFoundDraftPayload>(draft.moduleId, draft.draftId);
      if (loaded.moduleId === LOST_FOUND_MODULE_ID) {
        onOpenLostFoundDraft(loaded);
      }
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao carregar rascunho.",
      });
    }
  }

  async function removeDraft(draft: ModuleDraft) {
    if (!draft.draftId) {
      return;
    }
    try {
      await deleteDraft(draft.moduleId, draft.draftId);
      await refreshDrafts();
      showToast({ tone: "success", message: "Rascunho excluído." });
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao excluir rascunho.",
      });
    }
  }

  async function commitRename(draft: ModuleDraft) {
    if (!draft.draftId) {
      return;
    }
    try {
      await saveDraft(draft.moduleId, {
        ...draft,
        name: renameValue.trim() || draft.name,
      });
      setRenamingId(null);
      await refreshDrafts();
      showToast({ tone: "success", message: "Rascunho renomeado." });
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao renomear rascunho.",
      });
    }
  }

  return (
    <section className="page">
      <div className="section-title">
        <div>
          <h1>Rascunhos</h1>
          <span>Separados por módulo</span>
        </div>
        <label className="select-field">
          <span>Módulo</span>
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
          >
            {filteredModules.map((module) => (
              <option key={module.moduleId} value={module.moduleId}>
                {module.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="list-panel fill">
        <div className="list-header">
          <strong>
            <Archive size={17} /> Arquivos salvos
          </strong>
          <span>{loading ? "..." : drafts.length}</span>
        </div>

        {drafts.length === 0 ? (
          <EmptyState title="Nenhum rascunho neste módulo" />
        ) : (
          <div className="draft-list">
            {drafts.map((draft) => {
              const draftId = draft.draftId || "";
              const isRenaming = renamingId === draftId;
              return (
                <div className="draft-row" key={draftId}>
                  <div className="draft-main">
                    {isRenaming ? (
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      <strong>{draft.name}</strong>
                    )}
                    <span>{draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("pt-BR") : ""}</span>
                  </div>

                  {isRenaming ? (
                    <>
                      <IconButton
                        label="Confirmar"
                        icon={<Check size={16} />}
                        variant="primary"
                        onClick={() => commitRename(draft)}
                      />
                      <IconButton
                        label="Cancelar"
                        icon={<X size={16} />}
                        onClick={() => setRenamingId(null)}
                      />
                    </>
                  ) : (
                    <>
                      <IconButton
                        label="Abrir"
                        icon={<FolderOpen size={16} />}
                        onClick={() => openDraft(draft)}
                      />
                      <IconButton
                        label="Renomear"
                        icon={<Pencil size={16} />}
                        onClick={() => {
                          setRenamingId(draftId);
                          setRenameValue(draft.name);
                        }}
                      />
                      <IconButton
                        label="Excluir"
                        icon={<Trash2 size={16} />}
                        variant="danger"
                        onClick={() => removeDraft(draft)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
