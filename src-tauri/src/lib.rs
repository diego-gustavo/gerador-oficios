use calamine::{open_workbook_auto, Data, Reader};
use chrono::{Datelike, Local, NaiveDate};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
};
use tauri::{path::BaseDirectory, AppHandle, Manager};
use uuid::Uuid;
use zip::{write::FileOptions, ZipArchive, ZipWriter};

const LOST_FOUND_MODULE_ID: &str = "achados-e-perdidos";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModuleConfig {
    pub template_path: String,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub excel_path: String,
    pub default_save_dir: String,
    pub theme: String,
    pub interface_scale: u16,
    pub high_contrast: bool,
    pub modules: HashMap<String, ModuleConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModuleDraft {
    pub draft_id: Option<String>,
    pub module_id: String,
    pub name: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LostFoundItem {
    pub id: String,
    pub item: String,
    pub marca: Option<String>,
    pub descricao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LostFoundGeneratePayload {
    pub year: i32,
    pub officio_number: String,
    pub officio_date: String,
    pub responsible: String,
    pub items: Vec<LostFoundItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedDocument {
    pub path: String,
    pub officio_number: String,
}

fn default_suggestions() -> Vec<String> {
    [
        "Vale Transporte",
        "RG",
        "CIN",
        "Carteira",
        "Cartão",
        "Celular",
        "Chave",
        "Documento",
        "Bolsa",
        "Mochila",
        "Óculos",
        "Fone de Ouvido",
        "Carregador",
        "Guarda-chuva/sol",
        "Jaqueta",
        "Outros",
    ]
    .iter()
    .map(|value| value.to_string())
    .collect()
}

fn default_template_path(app: &AppHandle) -> String {
    app.path()
        .resolve(
            "resources/templates/achados-e-perdidos/template.docx",
            BaseDirectory::Resource,
        )
        .map(|path| path.to_string_lossy().to_string())
        .unwrap_or_else(|_| "resources/templates/achados-e-perdidos/template.docx".to_string())
}

fn default_config(app: &AppHandle) -> AppConfig {
    let mut modules = HashMap::new();
    modules.insert(
        LOST_FOUND_MODULE_ID.to_string(),
        ModuleConfig {
            template_path: default_template_path(app),
            suggestions: default_suggestions(),
        },
    );

    AppConfig {
        excel_path: "J:/Usuários/Documentos Gerais/Controle Ofícios - BRT Operação.xlsx"
            .to_string(),
        default_save_dir:
            "M:/Remissão/Base/Relatórios Fechados/Ofícios e protocolos/Ofícios 2026 - BRT"
                .to_string(),
        theme: "system".to_string(),
        interface_scale: 100,
        high_contrast: false,
        modules,
    }
}

fn merge_config(app: &AppHandle, mut config: AppConfig) -> AppConfig {
    let defaults = default_config(app);

    if config.theme.is_empty() {
        config.theme = defaults.theme;
    }
    if config.interface_scale == 0 {
        config.interface_scale = defaults.interface_scale;
    }

    for (module_id, module_defaults) in defaults.modules {
        config
            .modules
            .entry(module_id)
            .and_modify(|module| {
                if module.template_path.is_empty() {
                    module.template_path = module_defaults.template_path.clone();
                }
                if module.suggestions.is_empty() {
                    module.suggestions = module_defaults.suggestions.clone();
                }
            })
            .or_insert(module_defaults);
    }

    config
}

fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir)
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("config.json"))
}

fn read_config(app: &AppHandle) -> Result<AppConfig, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(default_config(app));
    }

    let text = fs::read_to_string(path).map_err(|err| err.to_string())?;
    let config = serde_json::from_str::<AppConfig>(&text).map_err(|err| err.to_string())?;
    Ok(merge_config(app, config))
}

fn write_config(app: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;
    let text = serde_json::to_string_pretty(config).map_err(|err| err.to_string())?;
    fs::write(path, text).map_err(|err| err.to_string())
}

fn drafts_root(app: &AppHandle, module_id: &str) -> Result<PathBuf, String> {
    let dir = app_data_dir(app)?.join("drafts").join(module_id);
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir)
}

fn sanitize_module_id(module_id: &str) -> Result<String, String> {
    let valid = module_id
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_');
    if valid && !module_id.trim().is_empty() {
        Ok(module_id.to_string())
    } else {
        Err("Identificador de módulo inválido.".to_string())
    }
}

fn now_iso() -> String {
    Local::now().to_rfc3339()
}

fn cell_to_string(cell: Option<&Data>) -> String {
    match cell {
        Some(Data::String(value)) => value.trim().to_string(),
        Some(Data::Float(value)) => {
            if value.fract() == 0.0 {
                format!("{}", *value as i64)
            } else {
                value.to_string()
            }
        }
        Some(Data::Int(value)) => value.to_string(),
        Some(Data::Bool(value)) => value.to_string(),
        Some(other) => other.to_string(),
        None => String::new(),
    }
}

fn find_sheet_by_year(path: &str, year: i32) -> Result<String, String> {
    let workbook = open_workbook_auto(path).map_err(|err| err.to_string())?;
    let sheet_names = workbook.sheet_names().to_owned();
    let year_text = year.to_string();
    let pattern = Regex::new(r"(?i)of[ií]cios emitidos").map_err(|err| err.to_string())?;

    sheet_names
        .into_iter()
        .find(|name| name.contains(&year_text) && pattern.is_match(name))
        .ok_or_else(|| format!("Nenhuma aba de Ofícios Emitidos encontrada para {}.", year))
}

fn next_number_from_sheet(path: &str, sheet_name: &str, year: i32) -> Result<String, String> {
    let mut workbook = open_workbook_auto(path).map_err(|err| err.to_string())?;
    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|err| err.to_string())?;
    let re =
        Regex::new(&format!(r"^\s*(\d+)\s*/\s*{}\s*$", year)).map_err(|err| err.to_string())?;
    let mut max_number = 0;

    for row in range.rows() {
        let raw = cell_to_string(row.get(0));
        if let Some(caps) = re.captures(&raw) {
            if let Some(number) = caps.get(1).and_then(|m| m.as_str().parse::<i32>().ok()) {
                max_number = max_number.max(number);
            }
        }
    }

    Ok(format!("{}/{}", max_number + 1, year))
}

fn last_row_in_first_column(path: &str, sheet_name: &str) -> Result<u32, String> {
    let mut workbook = open_workbook_auto(path).map_err(|err| err.to_string())?;
    let range = workbook
        .worksheet_range(sheet_name)
        .map_err(|err| err.to_string())?;
    let mut last = 0_u32;

    for (idx, row) in range.rows().enumerate() {
        if !cell_to_string(row.get(0)).is_empty() {
            last = (idx + 1) as u32;
        }
    }

    Ok(last)
}

fn parse_date_br(value: &str) -> Result<NaiveDate, String> {
    NaiveDate::parse_from_str(value.trim(), "%d/%m/%Y")
        .map_err(|_| "Data inválida. Use dd/mm/aaaa.".to_string())
}

fn long_date_text(date: NaiveDate) -> String {
    let months = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    let month = months[(date.month0()) as usize];
    format!("{} de {} de {}", date.day(), month, date.year())
}

fn format_lost_found_item(item: &LostFoundItem) -> String {
    let mut output = item.item.trim().to_string();

    if let Some(marca) = item
        .marca
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
    {
        output.push(' ');
        output.push('"');
        output.push_str(marca);
        output.push('"');
    }

    if let Some(descricao) = item
        .descricao
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
    {
        output.push_str(" - ");
        output.push_str(descricao);
    }

    output
}

fn escape_xml(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn list_xml(items: &[LostFoundItem], paragraph_properties: Option<&str>) -> String {
    let uses_word_numbering = paragraph_properties
        .map(|properties| properties.contains("<w:numPr>"))
        .unwrap_or(false);
    let ppr =
        paragraph_properties.unwrap_or(r#"<w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>"#);

    items
        .iter()
        .enumerate()
        .map(|(idx, item)| {
            let text = if uses_word_numbering {
                format_lost_found_item(item)
            } else {
                format!("{}. {}", idx + 1, format_lost_found_item(item))
            };
            format!(
                r#"<w:p>{}<w:r><w:t>{}</w:t></w:r></w:p>"#,
                ppr,
                escape_xml(&text),
            )
        })
        .collect::<Vec<_>>()
        .join("")
}

fn replace_list_placeholder(xml: &str, items: &[LostFoundItem]) -> Result<String, String> {
    let paragraph_re = Regex::new(r#"(?s)<w:p\b[^>]*>.*?\{\{LISTA_ITENS\}\}.*?</w:p>"#)
        .map_err(|err| err.to_string())?;
    let paragraph_properties_re =
        Regex::new(r#"(?s)<w:pPr\b[^>]*>.*?</w:pPr>"#).map_err(|err| err.to_string())?;

    if let Some(paragraph_match) = paragraph_re.find(xml) {
        let paragraph = paragraph_match.as_str();
        let paragraph_properties = paragraph_properties_re
            .find(paragraph)
            .map(|value| value.as_str());
        let replacement = list_xml(items, paragraph_properties);

        Ok(format!(
            "{}{}{}",
            &xml[..paragraph_match.start()],
            replacement,
            &xml[paragraph_match.end()..]
        ))
    } else if xml.contains("{{LISTA_ITENS}}") {
        let replacement = list_xml(items, None);
        Ok(xml.replace("{{LISTA_ITENS}}", &replacement))
    } else {
        Err("Tag {{LISTA_ITENS}} não encontrada no template.".to_string())
    }
}

fn replace_docx_tags(xml: &str, payload: &LostFoundGeneratePayload, date: NaiveDate) -> String {
    xml.replace("{{DATA}}", &escape_xml(&long_date_text(date)))
        .replace("{{OFICIO}}", &escape_xml(&payload.officio_number))
}

fn generate_docx_from_template(
    template_path: &Path,
    save_path: &Path,
    payload: &LostFoundGeneratePayload,
) -> Result<(), String> {
    if !template_path.exists() {
        return Err("Template Word não encontrado.".to_string());
    }
    if payload.items.is_empty() {
        return Err("Adicione pelo menos um item.".to_string());
    }

    let date = parse_date_br(&payload.officio_date)?;
    let input = fs::File::open(template_path).map_err(|err| err.to_string())?;
    let mut archive = ZipArchive::new(input).map_err(|err| err.to_string())?;
    let output = fs::File::create(save_path).map_err(|err| err.to_string())?;
    let mut writer = ZipWriter::new(output);
    let mut found_list_tag = false;

    for index in 0..archive.len() {
        let mut file = archive.by_index(index).map_err(|err| err.to_string())?;
        let file_name = file.name().to_string();
        let options = FileOptions::default()
            .compression_method(file.compression())
            .last_modified_time(file.last_modified());

        if file.is_dir() {
            writer
                .add_directory(file_name, options)
                .map_err(|err| err.to_string())?;
            continue;
        }

        let mut contents = Vec::new();
        file.read_to_end(&mut contents)
            .map_err(|err| err.to_string())?;

        let should_edit_xml = file_name == "word/document.xml"
            || file_name.starts_with("word/header")
            || file_name.starts_with("word/footer");

        if should_edit_xml {
            if let Ok(xml) = String::from_utf8(contents.clone()) {
                let mut edited = replace_docx_tags(&xml, payload, date);
                if edited.contains("{{LISTA_ITENS}}") {
                    edited = replace_list_placeholder(&edited, &payload.items)?;
                    found_list_tag = true;
                }
                contents = edited.into_bytes();
            }
        }

        writer
            .start_file(file_name, options)
            .map_err(|err| err.to_string())?;
        writer.write_all(&contents).map_err(|err| err.to_string())?;
    }

    writer.finish().map_err(|err| err.to_string())?;

    if !found_list_tag {
        return Err("Tag {{LISTA_ITENS}} não encontrada no template.".to_string());
    }

    Ok(())
}

fn module_config<'a>(config: &'a AppConfig, module_id: &str) -> Result<&'a ModuleConfig, String> {
    config
        .modules
        .get(module_id)
        .ok_or_else(|| "Módulo não configurado.".to_string())
}

fn save_filename(payload: &LostFoundGeneratePayload) -> Result<String, String> {
    let number = payload
        .officio_number
        .split('/')
        .next()
        .and_then(|part| part.parse::<u32>().ok())
        .ok_or_else(|| "Número do ofício inválido.".to_string())?;
    Ok(format!(
        "{} {:03} - Encaminhamento de Achados e Perdidos.docx",
        payload.year, number
    ))
}

#[tauri::command]
fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    let config = read_config(&app)?;
    write_config(&app, &config)?;
    Ok(config)
}

#[tauri::command]
fn save_config(app: AppHandle, config: AppConfig) -> Result<AppConfig, String> {
    let config = merge_config(&app, config);
    write_config(&app, &config)?;
    Ok(config)
}

#[tauri::command]
fn pick_file() -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .pick_file()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
fn pick_folder() -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
fn pick_save_file(
    default_file_name: String,
    default_dir: Option<String>,
) -> Result<Option<String>, String> {
    let mut dialog = rfd::FileDialog::new()
        .add_filter("Documento Word", &["docx"])
        .set_file_name(default_file_name);

    if let Some(dir) = default_dir.filter(|value| !value.trim().is_empty()) {
        let path = PathBuf::from(dir);
        if path.is_dir() {
            dialog = dialog.set_directory(path);
        }
    }

    Ok(dialog
        .save_file()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
fn get_default_save_filename(payload: LostFoundGeneratePayload) -> Result<String, String> {
    save_filename(&payload)
}

#[tauri::command]
fn get_next_officio(app: AppHandle, module_id: String, year: i32) -> Result<String, String> {
    sanitize_module_id(&module_id)?;
    let config = read_config(&app)?;
    let excel_path = config.excel_path.trim();
    if excel_path.is_empty() {
        return Ok(format!("1/{}", year));
    }

    match find_sheet_by_year(excel_path, year) {
        Ok(sheet_name) => next_number_from_sheet(excel_path, &sheet_name, year),
        Err(_) => Ok(format!("1/{}", year)),
    }
}

#[tauri::command]
fn generate_document(
    app: AppHandle,
    module_id: String,
    payload: LostFoundGeneratePayload,
    save_path: String,
) -> Result<GeneratedDocument, String> {
    let module_id = sanitize_module_id(&module_id)?;
    if module_id != LOST_FOUND_MODULE_ID {
        return Err("Gerador ainda não implementado.".to_string());
    }

    let config = read_config(&app)?;
    let module = module_config(&config, &module_id)?;
    let template_path = PathBuf::from(&module.template_path);
    let save_path = PathBuf::from(save_path);

    if let Some(parent) = save_path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }

    generate_docx_from_template(&template_path, &save_path, &payload)?;
    Ok(GeneratedDocument {
        path: save_path.to_string_lossy().to_string(),
        officio_number: payload.officio_number,
    })
}

#[tauri::command]
fn append_excel_row(
    app: AppHandle,
    module_id: String,
    payload: LostFoundGeneratePayload,
) -> Result<(), String> {
    let module_id = sanitize_module_id(&module_id)?;
    if module_id != LOST_FOUND_MODULE_ID {
        return Err("Registro em Excel ainda não implementado para este módulo.".to_string());
    }

    let config = read_config(&app)?;
    let excel_path = config.excel_path.trim();
    if excel_path.is_empty() {
        return Err("Caminho da planilha Excel não configurado.".to_string());
    }

    let date = parse_date_br(&payload.officio_date)?;
    let sheet_name = find_sheet_by_year(excel_path, payload.year)?;
    let new_row = last_row_in_first_column(excel_path, &sheet_name)? + 1;
    let path = PathBuf::from(excel_path);
    let mut workbook = umya_spreadsheet::reader::xlsx::read(&path).map_err(|err| {
        format!(
            "Não foi possível abrir a planilha. Feche o arquivo se ele estiver aberto e tente novamente. Detalhes: {}",
            err
        )
    })?;

    let sheet = workbook
        .get_sheet_by_name_mut(&sheet_name)
        .ok_or_else(|| "Aba da planilha não encontrada para escrita.".to_string())?;

    sheet
        .get_cell_mut(format!("A{}", new_row).as_str())
        .set_value(&payload.officio_number);
    sheet
        .get_cell_mut(format!("B{}", new_row).as_str())
        .set_value("Encaminhamento de Achados e Perdidos");
    sheet
        .get_cell_mut(format!("C{}", new_row).as_str())
        .set_value(date.format("%d/%m/%Y").to_string());
    sheet
        .get_cell_mut(format!("D{}", new_row).as_str())
        .set_value("Urbes");
    sheet
        .get_cell_mut(format!("E{}", new_row).as_str())
        .set_value(payload.responsible.trim());

    umya_spreadsheet::writer::xlsx::write(&workbook, &path).map_err(|err| {
        format!(
            "Não foi possível salvar a planilha. Feche o arquivo se ele estiver aberto e tente novamente. Detalhes: {}",
            err
        )
    })
}

#[tauri::command]
fn list_drafts(app: AppHandle, module_id: Option<String>) -> Result<Vec<ModuleDraft>, String> {
    let mut drafts = Vec::new();

    if let Some(module_id) = module_id {
        let module_id = sanitize_module_id(&module_id)?;
        let dir = drafts_root(&app, &module_id)?;
        read_drafts_from_dir(&dir, &mut drafts)?;
    } else {
        let root = app_data_dir(&app)?.join("drafts");
        if root.exists() {
            for entry in fs::read_dir(root).map_err(|err| err.to_string())? {
                let entry = entry.map_err(|err| err.to_string())?;
                if entry.path().is_dir() {
                    read_drafts_from_dir(&entry.path(), &mut drafts)?;
                }
            }
        }
    }

    drafts.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(drafts)
}

fn read_drafts_from_dir(dir: &Path, drafts: &mut Vec<ModuleDraft>) -> Result<(), String> {
    if !dir.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(dir).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
            continue;
        }
        let text = fs::read_to_string(path).map_err(|err| err.to_string())?;
        let draft = serde_json::from_str::<ModuleDraft>(&text).map_err(|err| err.to_string())?;
        drafts.push(draft);
    }

    Ok(())
}

#[tauri::command]
fn save_draft(
    app: AppHandle,
    module_id: String,
    mut draft: ModuleDraft,
) -> Result<ModuleDraft, String> {
    let module_id = sanitize_module_id(&module_id)?;
    let dir = drafts_root(&app, &module_id)?;
    let now = now_iso();
    let draft_id = draft
        .draft_id
        .clone()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let existing_path = dir.join(format!("{}.json", draft_id));
    let created_at = if existing_path.exists() {
        fs::read_to_string(&existing_path)
            .ok()
            .and_then(|text| serde_json::from_str::<ModuleDraft>(&text).ok())
            .and_then(|old| old.created_at)
            .unwrap_or_else(|| now.clone())
    } else {
        now.clone()
    };

    draft.draft_id = Some(draft_id.clone());
    draft.module_id = module_id;
    draft.created_at = Some(created_at);
    draft.updated_at = Some(now);

    if draft.name.trim().is_empty() {
        draft.name = "Rascunho sem nome".to_string();
    }

    let text = serde_json::to_string_pretty(&draft).map_err(|err| err.to_string())?;
    fs::write(existing_path, text).map_err(|err| err.to_string())?;
    Ok(draft)
}

#[tauri::command]
fn load_draft(app: AppHandle, module_id: String, draft_id: String) -> Result<ModuleDraft, String> {
    let module_id = sanitize_module_id(&module_id)?;
    let draft_id = sanitize_module_id(&draft_id)?;
    let path = drafts_root(&app, &module_id)?.join(format!("{}.json", draft_id));
    let text = fs::read_to_string(path).map_err(|_| "Rascunho não encontrado.".to_string())?;
    serde_json::from_str::<ModuleDraft>(&text).map_err(|err| err.to_string())
}

#[tauri::command]
fn delete_draft(app: AppHandle, module_id: String, draft_id: String) -> Result<(), String> {
    let module_id = sanitize_module_id(&module_id)?;
    let draft_id = sanitize_module_id(&draft_id)?;
    let path = drafts_root(&app, &module_id)?.join(format!("{}.json", draft_id));
    if path.exists() {
        fs::remove_file(path).map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_item() -> LostFoundItem {
        LostFoundItem {
            id: "item-1".to_string(),
            item: "Cartao".to_string(),
            marca: Some("Caixa".to_string()),
            descricao: Some("Diego".to_string()),
        }
    }

    fn sample_payload() -> LostFoundGeneratePayload {
        LostFoundGeneratePayload {
            year: 2026,
            officio_number: "7/2026".to_string(),
            officio_date: "05/06/2026".to_string(),
            responsible: "Diego".to_string(),
            items: vec![sample_item()],
        }
    }

    #[test]
    fn formats_lost_found_item_with_optional_fields() {
        assert_eq!(
            format_lost_found_item(&sample_item()),
            r#"Cartao "Caixa" - Diego"#
        );
    }

    #[test]
    fn formats_long_date_in_portuguese() {
        let date = NaiveDate::from_ymd_opt(2026, 6, 5).unwrap();
        assert_eq!(long_date_text(date), "5 de Junho de 2026");
    }

    #[test]
    fn builds_default_save_filename() {
        assert_eq!(
            save_filename(&sample_payload()).unwrap(),
            "2026 007 - Encaminhamento de Achados e Perdidos.docx"
        );
    }

    #[test]
    fn keeps_word_numbering_when_placeholder_paragraph_has_num_pr() {
        let ppr = r#"<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="9"/></w:numPr></w:pPr>"#;
        let xml = list_xml(&[sample_item()], Some(ppr));

        assert!(xml.contains(r#"<w:numId w:val="9"/>"#));
        assert!(xml.contains(r#"Cartao &quot;Caixa&quot; - Diego"#));
        assert!(!xml.contains("1. Cartao"));
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            pick_file,
            pick_folder,
            pick_save_file,
            get_default_save_filename,
            get_next_officio,
            generate_document,
            append_excel_row,
            list_drafts,
            save_draft,
            load_draft,
            delete_draft
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar o aplicativo Tauri");
}
