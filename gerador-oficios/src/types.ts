export const LOST_FOUND_MODULE_ID = "achados-e-perdidos";

export type AppRoute =
  | "generators"
  | "lost-found"
  | "drafts"
  | "settings"
  | "help";

export type ThemePreference = "light" | "dark" | "system";

export interface ModuleConfig {
  templatePath: string;
  suggestions: string[];
}

export interface AppConfig {
  excelPath: string;
  defaultSaveDir: string;
  theme: ThemePreference;
  interfaceScale: number;
  highContrast: boolean;
  modules: Record<string, ModuleConfig>;
}

export interface GeneratorModule {
  moduleId: string;
  name: string;
  shortName: string;
  route: AppRoute;
  description: string;
  templateTags: string[];
}

export interface ModuleDraft<TPayload = unknown> {
  draftId?: string;
  moduleId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  payload: TPayload;
}

export interface LostFoundItem {
  id: string;
  item: string;
  marca?: string;
  descricao?: string;
}

export interface LostFoundDraftPayload {
  year: number;
  officioNumber: string;
  officioDate: string;
  responsible: string;
  items: LostFoundItem[];
}

export interface LostFoundGeneratePayload {
  year: number;
  officioNumber: string;
  officioDate: string;
  responsible: string;
  items: LostFoundItem[];
}

export interface GeneratedDocument {
  path: string;
  officioNumber: string;
}

export interface ToastState {
  tone: "info" | "success" | "warning" | "danger";
  message: string;
}
