import type { ChangeEventHandler } from "react";
import type { AppContext } from "../app/context";
import { MESSAGES, errorMessage } from "../app/messages";
import { cloneConfig } from "../app/state";
import { defaultConfig, normalizeConfig } from "../config/defaults";
import type { GeneratorModule } from "../modules/contract";
import { generatorModules } from "../modules/registry";
import { pickFile, pickFolder, saveConfig } from "../services/tauri";
import type { AppConfig, ExcelColumnMap } from "../types";
import { ActionButton, Field, TextAreaField } from "../ui/components";

// Configurações usam um draft editável; só normalizam e salvam ao confirmar.
export function SettingsPage({ context }: { context: AppContext }) {
  const { state } = context;
  const draft = state.settingsDraft || cloneConfig(state.config);
  state.settingsDraft = draft;

  const handleThemeChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    updateSettings(context, (nextDraft) => {
      nextDraft.theme = event.currentTarget.value as AppConfig["theme"];
    });
  };

  const handleScaleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    updateSettings(context, (nextDraft) => {
      nextDraft.interfaceScale = Number(event.currentTarget.value);
    });
  };

  const handleContrastChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    updateSettings(context, (nextDraft) => {
      nextDraft.highContrast = event.currentTarget.checked;
    });
  };

  return (
    <section className="page settings-page">
      <div className="section-title">
        <div>
          <h1>Configurações</h1>
          <span>Módulos e aparência.</span>
        </div>
      </div>

      <div className="settings-sections">
        {generatorModules.map((module) => (
          <ModuleSettings context={context} draft={draft} key={module.moduleId} module={module} />
        ))}

        <section className="settings-section">
          <h2>Aparência</h2>
          <div className="form-grid compact">
            <label className="select-field">
              <span>Tema</span>
              <select id="cfg-theme" value={draft.theme} onChange={handleThemeChange}>
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </label>
            <label className="select-field">
              <span>Escala da interface</span>
              <select id="cfg-scale" value={draft.interfaceScale} onChange={handleScaleChange}>
                {[90, 100, 110, 120].map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </label>
            <label className="switch-field">
              <input
                id="cfg-contrast"
                type="checkbox"
                checked={draft.highContrast}
                onChange={handleContrastChange}
              />
              <span>Alto contraste</span>
            </label>
          </div>
        </section>
      </div>

      <footer className="settings-footer">
        <ActionButton
          iconName="rotate-ccw"
          label="Restaurar padrão"
          onClick={() => void handleResetConfig(context)}
          variant="danger"
        />
        <ActionButton
          iconName="save"
          label="Salvar configurações"
          onClick={() => void handleSaveConfig(context)}
          variant="primary"
        />
      </footer>
    </section>
  );
}

type ModuleSettingsProps = {
  context: AppContext;
  draft: AppConfig;
  module: GeneratorModule;
};

function ModuleSettings({ context, draft, module }: ModuleSettingsProps) {
  // Cada módulo tem caminhos, assunto, destino, colunas e sugestões independentes.
  const moduleConfig = draft.modules[module.moduleId];

  return (
    <section className="settings-section">
      <h2>Módulo {module.name}</h2>
      <div className="path-row">
        <Field
          id={`cfg-excel-${module.moduleId}`}
          label="Planilha Excel"
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              nextDraft.modules[module.moduleId].excelPath = value;
            });
          }}
          value={moduleConfig.excelPath}
        />
        <ActionButton
          iconName="folder-open"
          label="Procurar"
          onClick={() => void pickConfigPath(context, "excel", module.moduleId)}
        />
      </div>
      <div className="path-row">
        <Field
          id={`cfg-save-dir-${module.moduleId}`}
          label="Pasta padrão"
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              nextDraft.modules[module.moduleId].defaultSaveDir = value;
            });
          }}
          value={moduleConfig.defaultSaveDir}
        />
        <ActionButton
          iconName="folder-open"
          label="Procurar"
          onClick={() => void pickConfigPath(context, "save-dir", module.moduleId)}
        />
      </div>
      <div className="path-row">
        <Field
          id={`cfg-template-${module.moduleId}`}
          label="Template Word"
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              nextDraft.modules[module.moduleId].templatePath = value;
            });
          }}
          value={moduleConfig.templatePath}
        />
        <ActionButton
          iconName="folder-open"
          label="Procurar"
          onClick={() => void pickConfigPath(context, "template", module.moduleId)}
        />
      </div>
      <div className="form-grid compact">
        <Field
          id={`cfg-subject-${module.moduleId}`}
          label="Assunto na planilha"
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              nextDraft.modules[module.moduleId].excelSubject = value;
            });
          }}
          value={moduleConfig.excelSubject}
        />
        <Field
          id={`cfg-destination-${module.moduleId}`}
          label="Destino na planilha"
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              nextDraft.modules[module.moduleId].excelDestination = value;
            });
          }}
          value={moduleConfig.excelDestination}
        />
      </div>
      <div className="form-grid column-grid">
        {(["number", "subject", "date", "destination", "responsible"] as const).map(
          (columnKey) => (
            <ColumnField
              columns={moduleConfig.excelColumns}
              context={context}
              key={columnKey}
              moduleId={module.moduleId}
              columnKey={columnKey}
            />
          ),
        )}
      </div>
      {module.usesSuggestions ? (
        <TextAreaField
          id={`cfg-suggestions-${module.moduleId}`}
          label="Sugestões"
          rows={8}
          value={moduleConfig.suggestions.join("\n")}
          onChange={(value) => {
            updateSettings(context, (nextDraft) => {
              const suggestions = value
                .split(/\r?\n|,/)
                .map((item) => item.trim())
                .filter(Boolean);
              nextDraft.modules[module.moduleId].suggestions = suggestions;
            });
          }}
        />
      ) : null}
    </section>
  );
}

type ColumnFieldProps = {
  columnKey: keyof ExcelColumnMap;
  columns: ExcelColumnMap;
  context: AppContext;
  moduleId: string;
};

const columnLabels: Record<keyof ExcelColumnMap, string> = {
  date: "Data",
  destination: "Destino",
  number: "Número",
  responsible: "Responsável",
  subject: "Assunto",
};

function ColumnField({ columnKey, columns, context, moduleId }: ColumnFieldProps) {
  return (
    <Field
      id={`cfg-column-${moduleId}-${columnKey}`}
      label={`Coluna ${columnLabels[columnKey]}`}
      onChange={(value) => {
        updateSettings(context, (draft) => {
          draft.modules[moduleId].excelColumns[columnKey] = value.trim().toUpperCase();
        });
      }}
      value={columns[columnKey]}
    />
  );
}

function updateSettings(context: AppContext, updater: (draft: AppConfig) => void) {
  // Não normaliza a cada tecla para permitir campos temporariamente vazios.
  const draft = context.state.settingsDraft || cloneConfig(context.state.config);
  updater(draft);
  context.state.settingsDraft = draft;
  context.renderApp();
}

async function pickConfigPath(
  context: AppContext,
  target: "excel" | "template" | "save-dir",
  moduleId = "",
) {
  // Seletores nativos só retornam caminho dentro do app Tauri.
  const path = target === "save-dir" ? await pickFolder() : await pickFile();
  if (!path || !moduleId) {
    return;
  }

  updateSettings(context, (draft) => {
    if (target === "excel") {
      draft.modules[moduleId].excelPath = path;
    } else if (target === "template") {
      draft.modules[moduleId].templatePath = path;
    } else {
      draft.modules[moduleId].defaultSaveDir = path;
    }
  });
}

async function handleSaveConfig(context: AppContext) {
  // Salvar também invalida cache de numeração, pois a planilha pode ter mudado.
  const { state } = context;
  const draft = normalizeConfig(state.settingsDraft || state.config);
  try {
    const saved = await saveConfig(draft);
    state.config = normalizeConfig(saved);
    state.settingsDraft = cloneConfig(state.config);
    state.nextOfficioCache = {};
    context.applyAppearance();
    context.showToast({ tone: "success", message: MESSAGES.settingsSaved });
    context.renderApp();
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.settingsSaveFailed),
    });
  }
}

async function handleResetConfig(context: AppContext) {
  const accepted = await context.confirm({
    title: "Restaurar configurações",
    message: MESSAGES.confirmResetSettings,
    confirmLabel: "Restaurar",
    tone: "danger",
  });
  if (!accepted) {
    return;
  }

  const { state } = context;
  try {
    const saved = await saveConfig(normalizeConfig(defaultConfig));
    state.config = normalizeConfig(saved);
    state.settingsDraft = cloneConfig(state.config);
    state.nextOfficioCache = {};
    context.applyAppearance();
    context.showToast({ tone: "success", message: MESSAGES.settingsRestored });
    context.renderApp();
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: errorMessage(error, MESSAGES.settingsRestoreFailed),
    });
  }
}
