import type { AppContext } from "../app/context";
import { MESSAGES, errorMessage } from "../app/messages";
import { cloneConfig } from "../app/state";
import { defaultConfig, defaultSuggestions, normalizeConfig } from "../config/defaults";
import { generatorModules } from "../modules/registry";
import { pickFile, pickFolder, saveConfig } from "../services/tauri";
import { AppConfig, ExcelColumnMap, GeneratorModule } from "../types";
import { button, field } from "../ui/components";
import { bindInput, escapeAttr, escapeHtml, query } from "../ui/dom";

export function renderSettings(container: HTMLElement, context: AppContext) {
  const { state } = context;
  const draft = state.settingsDraft || cloneConfig(state.config);

  container.innerHTML = `
    <section class="page settings-page">
      <div class="section-title">
        <div>
          <h1>Configurações</h1>
          <span>Módulos e aparência.</span>
        </div>
      </div>

      <div class="settings-sections">
        ${generatorModules.map((module) => renderModuleSettings(module, draft)).join("")}

        <section class="settings-section">
          <h2>Aparência</h2>
          <div class="form-grid compact">
            <label class="select-field">
              <span>Tema</span>
              <select id="cfg-theme">
                <option value="system" ${draft.theme === "system" ? "selected" : ""}>Sistema</option>
                <option value="light" ${draft.theme === "light" ? "selected" : ""}>Claro</option>
                <option value="dark" ${draft.theme === "dark" ? "selected" : ""}>Escuro</option>
              </select>
            </label>
            <label class="select-field">
              <span>Escala da interface</span>
              <select id="cfg-scale">
                ${[90, 100, 110, 120]
                  .map(
                    (value) =>
                      `<option value="${value}" ${draft.interfaceScale === value ? "selected" : ""}>${value}%</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <label class="switch-field">
              <input id="cfg-contrast" type="checkbox" ${draft.highContrast ? "checked" : ""} />
              <span>Alto contraste</span>
            </label>
          </div>
        </section>
      </div>

      <footer class="settings-footer">
        ${button("Restaurar padrão", "rotate-ccw", "reset-config", { variant: "danger" })}
        ${button("Salvar configurações", "save", "save-config", { variant: "primary" })}
      </footer>
    </section>
  `;

  state.settingsDraft = draft;
  wireSettingsFields(container, context);
}

function renderModuleSettings(module: GeneratorModule, draft: AppConfig) {
  const moduleConfig = draft.modules[module.moduleId];
  const moduleId = escapeAttr(module.moduleId);

  // Cada módulo concentra seus próprios caminhos e regras de Excel.
  return `
    <section class="settings-section">
      <h2>Módulo ${escapeHtml(module.name)}</h2>
      <div class="path-row">
        ${field("Planilha Excel", `cfg-excel-${moduleId}`, moduleConfig.excelPath)}
        ${button("Procurar", "folder-open", "pick-excel", { id: module.moduleId })}
      </div>
      <div class="path-row">
        ${field("Pasta padrão", `cfg-save-dir-${moduleId}`, moduleConfig.defaultSaveDir)}
        ${button("Procurar", "folder-open", "pick-save-dir", { id: module.moduleId })}
      </div>
      <div class="path-row">
        ${field("Template Word", `cfg-template-${moduleId}`, moduleConfig.templatePath)}
        ${button("Procurar", "folder-open", "pick-template", { id: module.moduleId })}
      </div>
      <div class="form-grid compact">
        ${field("Assunto na planilha", `cfg-subject-${moduleId}`, moduleConfig.excelSubject)}
        ${field("Destino na planilha", `cfg-destination-${moduleId}`, moduleConfig.excelDestination)}
      </div>
      <div class="form-grid column-grid">
        ${renderColumnField(moduleId, "Número", "number", moduleConfig.excelColumns)}
        ${renderColumnField(moduleId, "Assunto", "subject", moduleConfig.excelColumns)}
        ${renderColumnField(moduleId, "Data", "date", moduleConfig.excelColumns)}
        ${renderColumnField(moduleId, "Destino", "destination", moduleConfig.excelColumns)}
        ${renderColumnField(moduleId, "Responsável", "responsible", moduleConfig.excelColumns)}
      </div>
      ${
        module.usesSuggestions
          ? `
            <label class="field" for="cfg-suggestions-${moduleId}">
              <span>Sugestões</span>
              <textarea id="cfg-suggestions-${moduleId}" rows="8">${escapeHtml(moduleConfig.suggestions.join("\n"))}</textarea>
            </label>
          `
          : ""
      }
    </section>
  `;
}

function renderColumnField(
  moduleId: string,
  label: string,
  key: keyof ExcelColumnMap,
  columns: ExcelColumnMap,
) {
  return field(`Coluna ${label}`, `cfg-column-${moduleId}-${key}`, columns[key]);
}

function updateSettings(context: AppContext, updater: (draft: AppConfig) => void) {
  const draft = context.state.settingsDraft || cloneConfig(context.state.config);
  updater(draft);
  context.state.settingsDraft = normalizeConfig(draft);
}

function wireSettingsFields(container: HTMLElement, context: AppContext) {
  generatorModules.forEach((module) => {
    bindInput(container, `#cfg-excel-${module.moduleId}`, (value) => {
      updateSettings(context, (draft) => {
        draft.modules[module.moduleId].excelPath = value;
      });
    });
    bindInput(container, `#cfg-save-dir-${module.moduleId}`, (value) => {
      updateSettings(context, (draft) => {
        draft.modules[module.moduleId].defaultSaveDir = value;
      });
    });
    bindInput(container, `#cfg-template-${module.moduleId}`, (value) => {
      updateSettings(context, (draft) => {
        draft.modules[module.moduleId].templatePath = value;
      });
    });
    bindInput(container, `#cfg-subject-${module.moduleId}`, (value) => {
      updateSettings(context, (draft) => {
        draft.modules[module.moduleId].excelSubject = value;
      });
    });
    bindInput(container, `#cfg-destination-${module.moduleId}`, (value) => {
      updateSettings(context, (draft) => {
        draft.modules[module.moduleId].excelDestination = value;
      });
    });
    (["number", "subject", "date", "destination", "responsible"] as const).forEach(
      (columnKey) => {
        bindInput(
          container,
          `#cfg-column-${module.moduleId}-${columnKey}`,
          (value) => {
            updateSettings(context, (draft) => {
              draft.modules[module.moduleId].excelColumns[columnKey] =
                value.trim().toUpperCase();
            });
          },
        );
      },
    );

    if (module.usesSuggestions) {
      bindInput(container, `#cfg-suggestions-${module.moduleId}`, (value) => {
        updateSettings(context, (draft) => {
          const suggestions = value
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean);
          draft.modules[module.moduleId].suggestions = suggestions.length
            ? suggestions
            : defaultSuggestions;
        });
      });
    }
  });

  bindInput(container, "#cfg-theme", (value) => {
    updateSettings(context, (draft) => {
      draft.theme = value as AppConfig["theme"];
    });
  });
  bindInput(container, "#cfg-scale", (value) => {
    updateSettings(context, (draft) => {
      draft.interfaceScale = Number(value);
    });
  });

  query<HTMLInputElement>("#cfg-contrast", container).addEventListener("change", (event) => {
    updateSettings(context, (draft) => {
      draft.highContrast = (event.currentTarget as HTMLInputElement).checked;
    });
  });

  container.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action || "";
      if (action === "pick-excel") {
        void pickConfigPath(context, "excel", item.dataset.id || "");
      } else if (action === "pick-template") {
        void pickConfigPath(context, "template", item.dataset.id || "");
      } else if (action === "pick-save-dir") {
        void pickConfigPath(context, "save-dir", item.dataset.id || "");
      } else if (action === "save-config") {
        void handleSaveConfig(context);
      } else if (action === "reset-config") {
        void handleResetConfig(context);
      }
    });
  });
}

async function pickConfigPath(
  context: AppContext,
  target: "excel" | "template" | "save-dir",
  moduleId = "",
) {
  const path = target === "save-dir" ? await pickFolder() : await pickFile();
  if (!path || !moduleId) {
    return;
  }

  updateSettings(context, (draft) => {
    if (target === "excel") {
      draft.modules[moduleId].excelPath = path;
    } else if (target === "template" && moduleId) {
      draft.modules[moduleId].templatePath = path;
    } else {
      draft.modules[moduleId].defaultSaveDir = path;
    }
  });
  context.renderApp();
}

async function handleSaveConfig(context: AppContext) {
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
  if (!window.confirm(MESSAGES.confirmResetSettings)) {
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
