import { defaultConfig, normalizeConfig } from "../config/defaults";
import { todayBrDate } from "../modules/lost-found/format";
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
}

export interface AppState {
  config: AppConfig;
  drafts: ModuleDraft[];
  draftsFilter: string;
  draftsLoading: boolean;
  lostFound: LostFoundState;
  renameDraftId: string | null;
  renameValue: string;
  route: AppRoute;
  settingsDraft: AppConfig | null;
  toast: ToastState | null;
}

export function createLostFoundState(): LostFoundState {
  const year = new Date().getFullYear();
  return {
    year,
    officioNumber: `1/${year}`,
    officioDate: todayBrDate(),
    responsible: "",
    items: [],
    busy: false,
    draftName: "Achados e Perdidos",
    editingId: null,
    itemName: "",
    loadingNumber: false,
    marca: "",
    descricao: "",
  };
}

export function createInitialState(route: AppRoute): AppState {
  return {
    config: defaultConfig,
    drafts: [],
    draftsFilter: LOST_FOUND_MODULE_ID,
    draftsLoading: false,
    lostFound: createLostFoundState(),
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
