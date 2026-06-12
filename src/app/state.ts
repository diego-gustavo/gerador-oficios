import { defaultConfig, normalizeConfig } from "../config/defaults";
import {
  defaultLostFoundDocumentName,
  todayBrDate,
} from "../modules/lost-found/format";
import {
  AppConfig,
  AppRoute,
  ConfirmationRequest,
  LOST_FOUND_MODULE_ID,
  LostFoundDraftPayload,
  ModuleDraft,
  ToastState,
} from "../types";

// Estado específico do gerador de Achados e Perdidos, incluindo campos de UI.
export interface LostFoundState extends LostFoundDraftPayload {
  busy: boolean;
  currentDraftId?: string;
  currentDraftName?: string;
  draftName: string;
  editingId: string | null;
  itemName: string;
  loadingNumber: boolean;
  marca: string;
  descricao: string;
  observacao: string;
}

export interface NextOfficioCacheEntry {
  value: string;
  loadedAt: number;
}

// Estado global do frontend. Cada página usa um recorte, mas tudo vive aqui.
export interface AppState {
  config: AppConfig;
  confirmation: ConfirmationRequest | null;
  drafts: ModuleDraft[];
  draftsFilter: string;
  draftsSearch: string;
  draftsLoading: boolean;
  lostFound: LostFoundState;
  nextOfficioCache: Record<string, NextOfficioCacheEntry>;
  renameDraftId: string | null;
  renameValue: string;
  route: AppRoute;
  settingsDraft: AppConfig | null;
  toast: ToastState | null;
}

export function createLostFoundState(): LostFoundState {
  // O nome do documento nasce bloqueado para seguir o padrão operacional.
  const year = new Date().getFullYear();
  const officioNumber = `1/${year}`;
  return {
    year,
    officioNumber,
    officioDate: todayBrDate(),
    documentName: defaultLostFoundDocumentName(year, officioNumber),
    documentNameLocked: true,
    responsible: "",
    items: [],
    busy: false,
    currentDraftName: undefined,
    draftName: "Achados e Perdidos",
    editingId: null,
    itemName: "",
    loadingNumber: false,
    marca: "",
    descricao: "",
    observacao: "",
  };
}

export function createInitialState(route: AppRoute): AppState {
  // Defaults permitem abrir o app no navegador mesmo sem backend Tauri.
  return {
    config: defaultConfig,
    confirmation: null,
    drafts: [],
    draftsFilter: LOST_FOUND_MODULE_ID,
    draftsSearch: "",
    draftsLoading: false,
    lostFound: createLostFoundState(),
    nextOfficioCache: {},
    renameDraftId: null,
    renameValue: "",
    route,
    settingsDraft: null,
    toast: null,
  };
}

export function cloneConfig(config: AppConfig): AppConfig {
  // JSON clone basta porque AppConfig é dado puro.
  return normalizeConfig(JSON.parse(JSON.stringify(config)) as AppConfig);
}
