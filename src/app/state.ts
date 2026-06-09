import { defaultConfig, normalizeConfig } from "../config/defaults";
import {
  defaultLostFoundDocumentName,
  todayBrDate,
} from "../modules/lost-found/format";
import {
  AppConfig,
  AppRoute,
  LOST_FOUND_MODULE_ID,
  LostFoundDraftPayload,
  ModuleDraft,
  ToastState,
} from "../types";

export interface LostFoundState extends LostFoundDraftPayload {
  busy: boolean;
  currentDraftId?: string;
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

export interface AppState {
  config: AppConfig;
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
  return {
    config: defaultConfig,
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
  return normalizeConfig(JSON.parse(JSON.stringify(config)) as AppConfig);
}
