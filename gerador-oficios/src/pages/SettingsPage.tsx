import { FolderOpen, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Field, TextareaField } from "../components/Field";
import { IconButton } from "../components/IconButton";
import { defaultSuggestions, normalizeConfig } from "../config/defaults";
import { generatorModules } from "../modules/registry";
import { pickFile, pickFolder, saveConfig } from "../services/tauri";
import { AppConfig, LOST_FOUND_MODULE_ID, ToastState } from "../types";

interface SettingsPageProps {
  config: AppConfig;
  onConfigSaved: (config: AppConfig) => void;
  showToast: (toast: ToastState) => void;
}

export function SettingsPage({ config, onConfigSaved, showToast }: SettingsPageProps) {
  const [draft, setDraft] = useState<AppConfig>(() => normalizeConfig(config));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(normalizeConfig(config));
  }, [config]);

  const suggestionsText = useMemo(
    () => draft.modules[LOST_FOUND_MODULE_ID]?.suggestions.join("\n") || "",
    [draft],
  );

  function update<K extends keyof AppConfig>(key: K, value: AppConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateLostFoundModule(
    key: "templatePath" | "suggestions",
    value: string | string[],
  ) {
    setDraft((current) => ({
      ...current,
      modules: {
        ...current.modules,
        [LOST_FOUND_MODULE_ID]: {
          ...current.modules[LOST_FOUND_MODULE_ID],
          [key]: value,
        },
      },
    }));
  }

  async function handlePickFile(target: "excel" | "template") {
    const path = await pickFile();
    if (!path) {
      return;
    }
    if (target === "excel") {
      update("excelPath", path);
      return;
    }
    updateLostFoundModule("templatePath", path);
  }

  async function handlePickFolder() {
    const path = await pickFolder();
    if (path) {
      update("defaultSaveDir", path);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveConfig(normalizeConfig(draft));
      onConfigSaved(saved);
      showToast({ tone: "success", message: "Configurações salvas." });
    } catch (error) {
      showToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Falha ao salvar configurações.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page settings-page">
      <div className="section-title">
        <div>
          <h1>Configurações</h1>
          <span>Caminhos, módulos e acessibilidade</span>
        </div>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h2>Caminhos</h2>
          <div className="path-row">
            <Field
              label="Planilha Excel"
              value={draft.excelPath}
              onChange={(event) => update("excelPath", event.target.value)}
            />
            <IconButton
              label="Procurar"
              icon={<FolderOpen size={17} />}
              onClick={() => handlePickFile("excel")}
            />
          </div>

          <div className="path-row">
            <Field
              label="Pasta padrão"
              value={draft.defaultSaveDir}
              onChange={(event) => update("defaultSaveDir", event.target.value)}
            />
            <IconButton
              label="Procurar"
              icon={<FolderOpen size={17} />}
              onClick={handlePickFolder}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2>Módulos</h2>
          {generatorModules.map((module) => (
            <div className="module-settings" key={module.moduleId}>
              <strong>{module.name}</strong>
              <div className="path-row">
                <Field
                  label="Template Word"
                  value={draft.modules[module.moduleId]?.templatePath || ""}
                  onChange={(event) =>
                    updateLostFoundModule("templatePath", event.target.value)
                  }
                />
                <IconButton
                  label="Procurar"
                  icon={<FolderOpen size={17} />}
                  onClick={() => handlePickFile("template")}
                />
              </div>

              <TextareaField
                label="Sugestões"
                value={suggestionsText}
                rows={7}
                onChange={(event) => {
                  const values = event.target.value
                    .split(/\r?\n|,/)
                    .map((value) => value.trim())
                    .filter(Boolean);
                  updateLostFoundModule(
                    "suggestions",
                    values.length > 0 ? values : defaultSuggestions,
                  );
                }}
              />
            </div>
          ))}
        </section>

        <section className="settings-section">
          <h2>Acessibilidade</h2>
          <div className="form-grid compact">
            <label className="select-field">
              <span>Tema</span>
              <select
                value={draft.theme}
                onChange={(event) =>
                  update("theme", event.target.value as AppConfig["theme"])
                }
              >
                <option value="system">Sistema</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </label>

            <label className="select-field">
              <span>Escala da interface</span>
              <select
                value={draft.interfaceScale}
                onChange={(event) =>
                  update("interfaceScale", Number(event.target.value))
                }
              >
                <option value={90}>90%</option>
                <option value={100}>100%</option>
                <option value={110}>110%</option>
                <option value={120}>120%</option>
              </select>
            </label>

            <label className="switch-field">
              <input
                type="checkbox"
                checked={draft.highContrast}
                onChange={(event) => update("highContrast", event.target.checked)}
              />
              <span>Alto contraste</span>
            </label>
          </div>
        </section>
      </div>

      <footer className="settings-footer">
        <IconButton
          label="Salvar configurações"
          icon={<Save size={18} />}
          variant="primary"
          onClick={handleSave}
          disabled={saving}
        />
      </footer>
    </section>
  );
}
