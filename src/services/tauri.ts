import { invoke } from "@tauri-apps/api/core";
import { defaultConfig, normalizeConfig } from "../config/defaults";
import {
  AppConfig,
  GeneratedDocument,
  LostFoundGeneratePayload,
  ModuleDraft,
} from "../types";

// Ponte única entre React e comandos Tauri, com fallback web para desenvolvimento.
const CONFIG_KEY = "gerador-oficios:config";
const DRAFTS_KEY = "gerador-oficios:drafts";

function isTauriRuntime() {
  // Tauri injeta __TAURI_INTERNALS__; no navegador comum usamos localStorage.
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

function readLocalConfig(): AppConfig {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) {
    return defaultConfig;
  }
  try {
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return defaultConfig;
  }
}

function writeLocalConfig(config: AppConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function readLocalDrafts(): ModuleDraft[] {
  const raw = localStorage.getItem(DRAFTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as ModuleDraft[];
  } catch {
    return [];
  }
}

function writeLocalDrafts(drafts: ModuleDraft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export async function loadConfig() {
  // Sempre normaliza para aceitar configs antigas ou incompletas.
  if (isTauriRuntime()) {
    return normalizeConfig(await invoke<AppConfig>("load_config"));
  }
  return readLocalConfig();
}

export async function saveConfig(config: AppConfig) {
  const normalized = normalizeConfig(config);
  if (isTauriRuntime()) {
    return normalizeConfig(await invoke<AppConfig>("save_config", { config: normalized }));
  }
  writeLocalConfig(normalized);
  return normalized;
}

export async function pickFile() {
  if (!isTauriRuntime()) {
    return null;
  }
  return invoke<string | null>("pick_file");
}

export async function pickFolder() {
  if (!isTauriRuntime()) {
    return null;
  }
  return invoke<string | null>("pick_folder");
}

export async function pickSaveFile(defaultFileName: string, defaultDir?: string) {
  // No navegador não há diálogo nativo; a ação é cancelada silenciosamente.
  if (!isTauriRuntime()) {
    return null;
  }
  return invoke<string | null>("pick_save_file", {
    defaultFileName,
    defaultDir: defaultDir || null,
  });
}

export async function getDefaultSaveFilename(payload: LostFoundGeneratePayload) {
  if (isTauriRuntime()) {
    return invoke<string>("get_default_save_filename", { payload });
  }
  if (payload.documentName.trim()) {
    return ensureDocxExtension(sanitizeFileName(payload.documentName));
  }
  const number = Number(payload.officioNumber.split("/")[0] || "1");
  return `${payload.year} ${String(number).padStart(3, "0")} - Encaminhamento de Achados e Perdidos.docx`;
}

function sanitizeFileName(value: string) {
  // Mantém o comportamento do backend para pré-visualizar nomes no navegador.
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").replace(/\s+/g, " ");
}

function ensureDocxExtension(value: string) {
  return value.toLowerCase().endsWith(".docx") ? value : `${value}.docx`;
}

export async function getNextOfficio(moduleId: string, year: number) {
  if (isTauriRuntime()) {
    return invoke<string>("get_next_officio", { moduleId, year });
  }
  return `1/${year}`;
}

export async function generateDocument(
  moduleId: string,
  payload: LostFoundGeneratePayload,
  savePath: string,
) {
  if (!isTauriRuntime()) {
    throw new Error("A geração de documentos está disponível apenas no app Tauri.");
  }
  return invoke<GeneratedDocument>("generate_document", {
    moduleId,
    payload,
    savePath,
  });
}

export async function appendExcelRow(moduleId: string, payload: LostFoundGeneratePayload) {
  if (!isTauriRuntime()) {
    throw new Error("O registro em planilha está disponível apenas no app Tauri.");
  }
  return invoke<void>("append_excel_row", { moduleId, payload });
}

export async function listDrafts(moduleId?: string) {
  if (isTauriRuntime()) {
    return invoke<ModuleDraft[]>("list_drafts", { moduleId: moduleId || null });
  }
  const drafts = readLocalDrafts();
  return moduleId ? drafts.filter((draft) => draft.moduleId === moduleId) : drafts;
}

export async function saveDraft<TPayload>(moduleId: string, draft: ModuleDraft<TPayload>) {
  // Fallback web conserva o mesmo formato JSON salvo pelo backend Tauri.
  if (isTauriRuntime()) {
    return invoke<ModuleDraft<TPayload>>("save_draft", {
      moduleId,
      draft,
    });
  }

  const now = new Date().toISOString();
  const draftId =
    draft.draftId ||
    ("crypto" in window && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : `${Date.now()}`);
  const nextDraft: ModuleDraft<TPayload> = {
    ...draft,
    draftId,
    moduleId,
    createdAt: draft.createdAt || now,
    updatedAt: now,
    name: draft.name.trim() || "Rascunho sem nome",
  };
  const drafts = readLocalDrafts().filter((item) => item.draftId !== draftId);
  writeLocalDrafts([nextDraft as ModuleDraft, ...drafts]);
  return nextDraft;
}

export async function loadDraft<TPayload>(moduleId: string, draftId: string) {
  if (isTauriRuntime()) {
    return invoke<ModuleDraft<TPayload>>("load_draft", {
      moduleId,
      draftId,
    });
  }
  const draft = readLocalDrafts().find(
    (item) => item.moduleId === moduleId && item.draftId === draftId,
  );
  if (!draft) {
    throw new Error("Rascunho não encontrado.");
  }
  return draft as ModuleDraft<TPayload>;
}

export async function deleteDraft(moduleId: string, draftId: string) {
  if (isTauriRuntime()) {
    return invoke<void>("delete_draft", { moduleId, draftId });
  }
  writeLocalDrafts(
    readLocalDrafts().filter(
      (draft) => draft.moduleId !== moduleId || draft.draftId !== draftId,
    ),
  );
}
