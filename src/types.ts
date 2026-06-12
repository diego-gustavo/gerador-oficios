// Tipos compartilhados entre UI, serviços e módulos de geração.
export const LOST_FOUND_MODULE_ID = "achados-e-perdidos";

export type AppRoute =
  | "generators"
  | "lost-found"
  | "drafts"
  | "settings"
  | "help";

export type ThemePreference = "light" | "dark" | "system";

export interface ExcelColumnMap {
  number: string;
  subject: string;
  date: string;
  destination: string;
  responsible: string;
}

export interface ModuleConfig {
  excelPath: string;
  defaultSaveDir: string;
  templatePath: string;
  suggestions: string[];
  excelSubject: string;
  excelDestination: string;
  excelColumns: ExcelColumnMap;
}

export interface AppConfig {
  theme: ThemePreference;
  interfaceScale: number;
  highContrast: boolean;
  modules: Record<string, ModuleConfig>;
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
  observacao?: string;
}

export interface LostFoundDraftPayload {
  year: number;
  officioNumber: string;
  officioDate: string;
  documentName: string;
  documentNameLocked: boolean;
  responsible: string;
  items: LostFoundItem[];
}

export interface LostFoundGeneratePayload {
  year: number;
  officioNumber: string;
  officioDate: string;
  documentName: string;
  responsible: string;
  items: LostFoundItem[];
}

export interface GeneratedDocument {
  path: string;
  officioNumber: string;
}

export interface ConfirmationRequest {
  cancelLabel?: string;
  confirmLabel: string;
  message: string;
  title: string;
  tone?: "default" | "danger";
}

export interface ToastState {
  tone: "info" | "success" | "warning" | "danger";
  message: string;
}
