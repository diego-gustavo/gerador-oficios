import type { AppContext } from "../app/context";
import { cloneConfig } from "../app/state";
import { defaultSuggestions, normalizeConfig } from "../config/defaults";
import { pickFile, pickFolder, saveConfig } from "../services/tauri";
import { AppConfig, LOST_FOUND_MODULE_ID } from "../types";
import { button, field } from "../ui/components";
import { bindInput, escapeHtml, query } from "../ui/dom";

export function renderSettings(container: HTMLElement, context: AppContext) {
  const { state } = context;
  const draft = state.settingsDraft || cloneConfig(state.config);
  const moduleConfig = draft.modules[LOST_FOUND_MODULE_ID];

  container.innerHTML = `
    <section class="page settings-page">
      <div class="section-title">
        <div>
          <h1>Configuracoes</h1>
          <span>Caminhos, modulos e acessibilidade.</span>
        </div>
      </div>

      <div class="settings-sections">
        <section class="settings-section">
          <h2>Caminhos</h2>
          <div class="path-row">
            ${field("Planilha Excel", "cfg-excel", draft.excelPath)}
            ${button("Procurar", "folder-open", "pick-excel")}
          </div>
          <div class="path-row">
            ${field("Pasta padrao", "cfg-save-dir", draft.defaultSaveDir)}
            ${button("Procurar", "folder-open", "pick-save-dir")}
          </div>
        </section>

        <section class="settings-section">
          <h2>Modulo Achados e Perdidos</h2>
          <div class="path-row">
            ${field("Template Word", "cfg-template", moduleConfig.templatePath)}
            ${button("Procurar", "folder-open", "pick-template")}
          </div>
          <label class="field" for="cfg-suggestions">
            <span>Sugestoes</span>
            <textarea id="cfg-suggestions" rows="8">${escapeHtml(moduleConfig.suggestions.join("\n"))}</textarea>
          </label>
        </section>

        <section class="settings-section">
          <h2>Acessibilidade</h2>
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
        ${button("Salvar configuracoes", "save", "save-config", { variant: "primary" })}
      </footer>
    </section>
  `;

  state.settingsDraft = draft;
  wireSettingsFields(container, context);
}

function updateSettings(context: AppContext, updater: (draft: AppConfig) => void) {
  const draft = context.state.settingsDraft || cloneConfig(context.state.config);
  updater(draft);
  context.state.settingsDraft = normalizeConfig(draft);
}

function wireSettingsFields(container: HTMLElement, context: AppContext) {
  bindInput(container, "#cfg-excel", (value) => {
    updateSettings(context, (draft) => {
      draft.excelPath = value;
    });
  });
  bindInput(container, "#cfg-save-dir", (value) => {
    updateSettings(context, (draft) => {
      draft.defaultSaveDir = value;
    });
  });
  bindInput(container, "#cfg-template", (value) => {
    updateSettings(context, (draft) => {
      draft.modules[LOST_FOUND_MODULE_ID].templatePath = value;
    });
  });
  bindInput(container, "#cfg-suggestions", (value) => {
    updateSettings(context, (draft) => {
      const suggestions = value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
      draft.modules[LOST_FOUND_MODULE_ID].suggestions = suggestions.length
        ? suggestions
        : defaultSuggestions;
    });
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
        void pickConfigPath(context, "excel");
      } else if (action === "pick-template") {
        void pickConfigPath(context, "template");
      } else if (action === "pick-save-dir") {
        void pickConfigPath(context, "save-dir");
      } else if (action === "save-config") {
        void handleSaveConfig(context);
      }
    });
  });
}

async function pickConfigPath(
  context: AppContext,
  target: "excel" | "template" | "save-dir",
) {
  const path = target === "save-dir" ? await pickFolder() : await pickFile();
  if (!path) {
    return;
  }

  updateSettings(context, (draft) => {
    if (target === "excel") {
      draft.excelPath = path;
    } else if (target === "template") {
      draft.modules[LOST_FOUND_MODULE_ID].templatePath = path;
    } else {
      draft.defaultSaveDir = path;
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
    context.applyAppearance();
    context.showToast({ tone: "success", message: "Configuracoes salvas." });
    context.renderApp();
  } catch (error) {
    context.showToast({
      tone: "danger",
      message: error instanceof Error ? error.message : "Falha ao salvar configuracoes.",
    });
  }
}
