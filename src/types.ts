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

export interface GeneratorModule {
  // Metadados que permitem listar, configurar e documentar cada gerador.
  moduleId: string;
  name: string;
  shortName: string;
  route: AppRoute;
  description: string;
  iconName: string;
  defaultDraftName: string;
  defaultTemplatePath: string;
  usesSuggestions: boolean;
  templateTags: string[];
  excel: {
    subject: string;
    destination: string;
    columns: ExcelColumnMap;
  };
  helpSteps: string[];
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

export interface ToastState {
  tone: "info" | "success" | "warning" | "danger";
  message: string;
}
