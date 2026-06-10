//! Backend Tauri: persiste configuração/rascunhos, gera DOCX e registra Excel.

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
pub struct ExcelColumnMap {
    pub number: Option<String>,
    pub subject: Option<String>,
    pub date: Option<String>,
    pub destination: Option<String>,
    pub responsible: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModuleConfig {
    #[serde(default)]
    pub excel_path: String,
    #[serde(default)]
    pub default_save_dir: String,
    #[serde(default)]
    pub template_path: String,
    #[serde(default)]
    pub suggestions: Vec<String>,
    pub excel_subject: Option<String>,
    pub excel_destination: Option<String>,
    pub excel_columns: Option<ExcelColumnMap>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub theme: String,
    pub interface_scale: u16,
    pub high_contrast: bool,
    pub modules: HashMap<String, ModuleConfig>,
    #[serde(default, rename = "excelPath", skip_serializing)]
    pub legacy_excel_path: Option<String>,
    #[serde(default, rename = "defaultSaveDir", skip_serializing)]
    pub legacy_default_save_dir: Option<String>,
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
    pub observacao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LostFoundGeneratePayload {
    pub year: i32,
    pub officio_number: String,
    pub officio_date: String,
    pub document_name: Option<String>,
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
    // Mesma lista inicial do frontend para manter fallback nativo consistente.
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
            excel_path: "J:/Usuários/Documentos Gerais/Controle Ofícios - BRT Operação.xlsx"
                .to_string(),
            default_save_dir:
                "M:/Remissão/Base/Relatórios Fechados/Ofícios e protocolos/Ofícios 2026 - BRT"
                    .to_string(),
            template_path: default_template_path(app),
            suggestions: default_suggestions(),
            excel_subject: Some("Encaminhamento de Achados e Perdidos".to_string()),
            excel_destination: Some("Urbes".to_string()),
            excel_columns: Some(ExcelColumnMap {
                number: Some("A".to_string()),
                subject: Some("B".to_string()),
                date: Some("C".to_string()),
                destination: Some("D".to_string()),
                responsible: Some("E".to_string()),
            }),
        },
    );

    AppConfig {
        theme: "system".to_string(),
        interface_scale: 100,
        high_contrast: false,
        modules,
        legacy_excel_path: None,
        legacy_default_save_dir: None,
    }
}

fn merge_config(app: &AppHandle, mut config: AppConfig) -> AppConfig {
    // Config salva pode vir de versões antigas; merge preserva valor do usuário
    // e completa só o que faltar.
    let defaults = default_config(app);

    // Compatibilidade: versões antigas salvavam os caminhos no topo da config.
    // Ao carregar, migramos esses valores para cada módulo e gravamos só o formato novo.
    let legacy_excel_path = config
        .legacy_excel_path
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());
    let legacy_default_save_dir = config
        .legacy_default_save_dir
        .take()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

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
                if module.excel_path.trim().is_empty() {
                    module.excel_path = legacy_excel_path
                        .clone()
                        .unwrap_or_else(|| module_defaults.excel_path.clone());
                }
                if module.default_save_dir.trim().is_empty() {
                    module.default_save_dir = legacy_default_save_dir
                        .clone()
                        .unwrap_or_else(|| module_defaults.default_save_dir.clone());
                }
                if module.template_path.is_empty() {
                    module.template_path = module_defaults.template_path.clone();
                }
                if module.suggestions.is_empty() {
                    module.suggestions = module_defaults.suggestions.clone();
                }
                if module
                    .excel_subject
                    .as_deref()
                    .unwrap_or("")
                    .trim()
                    .is_empty()
                {
                    module.excel_subject = module_defaults.excel_subject.clone();
                }
                if module
                    .excel_destination
                    .as_deref()
                    .unwrap_or("")
                    .trim()
                    .is_empty()
                {
                    module.excel_destination = module_defaults.excel_destination.clone();
                }
                if module.excel_columns.is_none() {
                    module.excel_columns = module_defaults.excel_columns.clone();
                }
            })
            .or_insert(module_defaults);
    }

    config.legacy_excel_path = None;
    config.legacy_default_save_dir = None;

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
    // IDs viram nomes de pasta; por isso restringimos a caracteres seguros.
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
    // A planilha operacional usa uma aba por ano com "Ofícios Emitidos" no nome.
    if !Path::new(path).exists() {
        return Err("Planilha Excel não encontrada.".to_string());
    }

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
    // Percorre a primeira coluna e escolhe o próximo número do maior n/ano.
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

    if let Some(observacao) = item
        .observacao
        .as_ref()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
    {
        output.push(' ');
        output.push('(');
        output.push_str(observacao);
        output.push(')');
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

fn normalize_split_placeholder(xml: &str, tag: &str) -> Result<String, String> {
    // Word pode quebrar tags em vários runs XML; esta regex junta de novo.
    let separator = r#"(?:\s*<[^>]+>\s*)*"#;
    let mut pattern = String::new();

    for (index, ch) in tag.chars().enumerate() {
        if index > 0 {
            pattern.push_str(separator);
        }
        pattern.push_str(&regex::escape(&ch.to_string()));
    }

    let re = Regex::new(&pattern).map_err(|err| err.to_string())?;
    Ok(re.replace_all(xml, tag).to_string())
}

fn normalize_docx_placeholders(xml: &str) -> Result<String, String> {
    let mut normalized = xml.to_string();

    for tag in ["{{DATA}}", "{{OFICIO}}", "{{LISTA_ITENS}}"] {
        normalized = normalize_split_placeholder(&normalized, tag)?;
    }

    Ok(normalized)
}

fn list_xml(items: &[LostFoundItem], paragraph_properties: Option<&str>) -> String {
    // Se o template usa numeração do Word, preservamos o estilo da lista.
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
    let paragraph_re = Regex::new(r#"(?s)<w:p\b[^>]*>.*?</w:p>"#).map_err(|err| err.to_string())?;
    let paragraph_properties_re =
        Regex::new(r#"(?s)<w:pPr\b[^>]*>.*?</w:pPr>"#).map_err(|err| err.to_string())?;

    for paragraph_match in paragraph_re.find_iter(xml) {
        let paragraph = paragraph_match.as_str();
        if !paragraph.contains("{{LISTA_ITENS}}") {
            continue;
        }

        let paragraph_properties = paragraph_properties_re
            .find(paragraph)
            .map(|value| value.as_str());
        let replacement = list_xml(items, paragraph_properties);

        return Ok(format!(
            "{}{}{}",
            &xml[..paragraph_match.start()],
            replacement,
            &xml[paragraph_match.end()..]
        ));
    }

    if xml.contains("{{LISTA_ITENS}}") {
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
    // DOCX é ZIP: editamos document/header/footer XML e copiamos o restante intacto.
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
                let mut edited = normalize_docx_placeholders(&xml)?;
                edited = replace_docx_tags(&edited, payload, date);
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

fn sanitize_file_name(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ch.is_control() || matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*')
            {
                ' '
            } else {
                ch
            }
        })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn ensure_docx_extension(value: &str) -> String {
    if value.to_lowercase().ends_with(".docx") {
        value.to_string()
    } else {
        format!("{}.docx", value)
    }
}

fn backup_excel_file(path: &Path) -> Result<(), String> {
    // Toda escrita de Excel gera backup local antes de alterar o arquivo original.
    let parent = path
        .parent()
        .ok_or_else(|| "Não foi possível localizar a pasta da planilha.".to_string())?;
    let file_name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Nome da planilha inválido para backup.".to_string())?;
    let backup_dir = parent.join(".backups");
    fs::create_dir_all(&backup_dir)
        .map_err(|err| format!("Não foi possível criar a pasta de backup: {}", err))?;

    let stamp = Local::now().format("%Y%m%d-%H%M%S");
    let backup_path = backup_dir.join(format!("{}-{}", stamp, file_name));
    fs::copy(path, backup_path)
        .map(|_| ())
        .map_err(|err| format!("Não foi possível criar backup da planilha: {}", err))
}

fn excel_column(value: Option<&String>, fallback: &str) -> String {
    let raw = value.map(|value| value.trim()).unwrap_or("");
    let valid = !raw.is_empty() && raw.chars().all(|ch| ch.is_ascii_alphabetic());
    if valid {
        raw.to_uppercase()
    } else {
        fallback.to_string()
    }
}

fn save_filename(payload: &LostFoundGeneratePayload) -> Result<String, String> {
    if let Some(document_name) = payload
        .document_name
        .as_ref()
        .map(|value| sanitize_file_name(value))
        .filter(|value| !value.trim().is_empty())
    {
        return Ok(ensure_docx_extension(&document_name));
    }

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

fn append_excel_row_to_path(
    excel_path: &str,
    module: &ModuleConfig,
    payload: &LostFoundGeneratePayload,
) -> Result<(), String> {
    // Lê com calamine para localizar a linha e escreve com umya-spreadsheet.
    let date = parse_date_br(&payload.officio_date)?;
    let sheet_name = find_sheet_by_year(excel_path, payload.year)?;
    let new_row = last_row_in_first_column(excel_path, &sheet_name)? + 1;
    let path = PathBuf::from(excel_path);
    backup_excel_file(&path)?;
    let mut workbook = umya_spreadsheet::reader::xlsx::read(&path).map_err(|err| {
        format!(
            "Não foi possível abrir a planilha. Feche o arquivo se ele estiver aberto e tente novamente. Detalhes: {}",
            err
        )
    })?;

    let sheet = workbook
        .get_sheet_by_name_mut(&sheet_name)
        .ok_or_else(|| "Aba da planilha não encontrada para escrita.".to_string())?;

    let columns = module.excel_columns.as_ref();
    let number_column = excel_column(columns.and_then(|value| value.number.as_ref()), "A");
    let subject_column = excel_column(columns.and_then(|value| value.subject.as_ref()), "B");
    let date_column = excel_column(columns.and_then(|value| value.date.as_ref()), "C");
    let destination_column =
        excel_column(columns.and_then(|value| value.destination.as_ref()), "D");
    let responsible_column =
        excel_column(columns.and_then(|value| value.responsible.as_ref()), "E");

    sheet
        .get_cell_mut(format!("{}{}", number_column, new_row).as_str())
        .set_value(&payload.officio_number);
    sheet
        .get_cell_mut(format!("{}{}", subject_column, new_row).as_str())
        .set_value(
            module
                .excel_subject
                .as_deref()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or("Encaminhamento de Achados e Perdidos"),
        );
    sheet
        .get_cell_mut(format!("{}{}", date_column, new_row).as_str())
        .set_value(date.format("%d/%m/%Y").to_string());
    sheet
        .get_cell_mut(format!("{}{}", destination_column, new_row).as_str())
        .set_value(
            module
                .excel_destination
                .as_deref()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or("Urbes"),
        );
    sheet
        .get_cell_mut(format!("{}{}", responsible_column, new_row).as_str())
        .set_value(payload.responsible.trim());

    umya_spreadsheet::writer::xlsx::write(&workbook, &path).map_err(|err| {
        format!(
            "Não foi possível salvar a planilha. Feche o arquivo se ele estiver aberto e tente novamente. Detalhes: {}",
            err
        )
    })
}

#[tauri::command]
fn get_next_officio(app: AppHandle, module_id: String, year: i32) -> Result<String, String> {
    sanitize_module_id(&module_id)?;
    let config = read_config(&app)?;
    let module = module_config(&config, &module_id)?;
    let excel_path = module.excel_path.trim();
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
    let module = module_config(&config, &module_id)?;
    let excel_path = module.excel_path.trim();
    if excel_path.is_empty() {
        return Err("Caminho da planilha Excel não configurado.".to_string());
    }

    append_excel_row_to_path(excel_path, module, &payload)
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

    struct TestDir(PathBuf);

    impl TestDir {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!("gerador-oficios-{}", Uuid::new_v4()));
            fs::create_dir_all(&path).unwrap();
            Self(path)
        }

        fn join(&self, name: &str) -> PathBuf {
            self.0.join(name)
        }
    }

    impl Drop for TestDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn sample_item() -> LostFoundItem {
        LostFoundItem {
            id: "item-1".to_string(),
            item: "Cartao".to_string(),
            marca: Some("Caixa".to_string()),
            descricao: Some("Diego".to_string()),
            observacao: Some("Azul".to_string()),
        }
    }

    fn sample_payload() -> LostFoundGeneratePayload {
        LostFoundGeneratePayload {
            year: 2026,
            officio_number: "7/2026".to_string(),
            officio_date: "05/06/2026".to_string(),
            document_name: None,
            responsible: "Diego".to_string(),
            items: vec![sample_item()],
        }
    }

    fn sample_module_config() -> ModuleConfig {
        ModuleConfig {
            excel_path: String::new(),
            default_save_dir: String::new(),
            template_path: String::new(),
            suggestions: Vec::new(),
            excel_subject: Some("Encaminhamento de Achados e Perdidos".to_string()),
            excel_destination: Some("Urbes".to_string()),
            excel_columns: Some(ExcelColumnMap {
                number: Some("A".to_string()),
                subject: Some("B".to_string()),
                date: Some("C".to_string()),
                destination: Some("D".to_string()),
                responsible: Some("E".to_string()),
            }),
        }
    }

    fn write_docx_fixture(path: &Path, document_xml: &str) {
        let output = fs::File::create(path).unwrap();
        let mut writer = ZipWriter::new(output);
        let options = FileOptions::default();

        writer.start_file("[Content_Types].xml", options).unwrap();
        writer
            .write_all(
                br#"<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>"#,
            )
            .unwrap();
        writer.add_directory("word", options).unwrap();
        writer.start_file("word/document.xml", options).unwrap();
        writer.write_all(document_xml.as_bytes()).unwrap();
        writer.finish().unwrap();
    }

    fn read_docx_part(path: &Path, part_name: &str) -> String {
        let input = fs::File::open(path).unwrap();
        let mut archive = ZipArchive::new(input).unwrap();
        let mut part = archive.by_name(part_name).unwrap();
        let mut contents = String::new();
        part.read_to_string(&mut contents).unwrap();
        contents
    }

    fn write_excel_fixture(path: &Path) {
        let mut workbook = umya_spreadsheet::new_file();
        workbook
            .get_sheet_mut(&0)
            .unwrap()
            .set_name("2026 Ofícios Emitidos");
        let sheet = workbook
            .get_sheet_by_name_mut("2026 Ofícios Emitidos")
            .unwrap();

        sheet.get_cell_mut("A1").set_value("Número");
        sheet.get_cell_mut("A2").set_value("6/2026");
        sheet.get_cell_mut("A3").set_value("2/2026");
        umya_spreadsheet::writer::xlsx::write(&workbook, path).unwrap();
    }

    #[test]
    fn formats_lost_found_item_with_optional_fields() {
        assert_eq!(
            format_lost_found_item(&sample_item()),
            r#"Cartao "Caixa" - Diego (Azul)"#
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
        assert!(xml.contains(r#"Cartao &quot;Caixa&quot; - Diego (Azul)"#));
        assert!(!xml.contains("1. Cartao"));
    }

    #[test]
    fn normalizes_docx_placeholders_split_across_runs() {
        let xml = r#"
            <w:p>
                <w:r><w:t>{{DA</w:t></w:r>
                <w:r><w:t>TA}}</w:t></w:r>
            </w:p>
            <w:p>
                <w:r><w:t>{{OF</w:t></w:r>
                <w:r><w:t>ICIO}}</w:t></w:r>
            </w:p>
        "#;

        let normalized = normalize_docx_placeholders(xml).unwrap();

        assert!(normalized.contains("{{DATA}}"));
        assert!(normalized.contains("{{OFICIO}}"));
    }

    #[test]
    fn generates_docx_and_replaces_split_tags() {
        let dir = TestDir::new();
        let template_path = dir.join("template.docx");
        let output_path = dir.join("output.docx");
        let document_xml = r#"
            <?xml version="1.0" encoding="UTF-8"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:body>
                    <w:p><w:r><w:t>Data: {{DA</w:t></w:r><w:r><w:t>TA}}</w:t></w:r></w:p>
                    <w:p><w:r><w:t>Ofício: {{OF</w:t></w:r><w:r><w:t>ICIO}}</w:t></w:r></w:p>
                    <w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:t>{{LISTA_</w:t></w:r><w:r><w:t>ITENS}}</w:t></w:r></w:p>
                </w:body>
            </w:document>
        "#;
        write_docx_fixture(&template_path, document_xml);

        generate_docx_from_template(&template_path, &output_path, &sample_payload()).unwrap();

        let xml = read_docx_part(&output_path, "word/document.xml");
        assert!(xml.contains("5 de Junho de 2026"));
        assert!(xml.contains("7/2026"));
        assert!(xml.contains("1. Cartao &quot;Caixa&quot; - Diego (Azul)"));
        assert!(!xml.contains("{{DATA}}"));
        assert!(!xml.contains("{{OFICIO}}"));
        assert!(!xml.contains("{{LISTA_ITENS}}"));
    }

    #[test]
    fn detects_next_number_from_spreadsheet_fixture() {
        let dir = TestDir::new();
        let path = dir.join("controle.xlsx");
        write_excel_fixture(&path);
        let path_text = path.to_string_lossy();

        let sheet_name = find_sheet_by_year(&path_text, 2026).unwrap();

        assert_eq!(sheet_name, "2026 Ofícios Emitidos");
        assert_eq!(
            next_number_from_sheet(&path_text, &sheet_name, 2026).unwrap(),
            "7/2026"
        );
    }

    #[test]
    fn appends_excel_row_to_configured_columns() {
        let dir = TestDir::new();
        let path = dir.join("controle.xlsx");
        write_excel_fixture(&path);
        let path_text = path.to_string_lossy();

        append_excel_row_to_path(&path_text, &sample_module_config(), &sample_payload()).unwrap();

        let mut workbook = open_workbook_auto(&*path_text).unwrap();
        let range = workbook.worksheet_range("2026 Ofícios Emitidos").unwrap();
        let row = range.rows().nth(3).unwrap();
        assert_eq!(cell_to_string(row.get(0)), "7/2026");
        assert_eq!(
            cell_to_string(row.get(1)),
            "Encaminhamento de Achados e Perdidos"
        );
        assert_eq!(cell_to_string(row.get(2)), "05/06/2026");
        assert_eq!(cell_to_string(row.get(3)), "Urbes");
        assert_eq!(cell_to_string(row.get(4)), "Diego");
        assert!(dir.join(".backups").is_dir());
    }
}

pub fn run() {
    // Lista explícita de comandos expostos ao frontend via invoke().
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
