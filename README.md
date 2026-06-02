# Lost & Found Memorandum Generator (BRT Sorocaba)

This document describes in detail the structure, sections, and functions of the code for the memorandum automation and database registration (Excel) system.

## 1. REQUIREMENTS AND DEPENDENCIES

The script uses the following libraries and modules:

* os, datetime, re, json, sys, shutil: Native modules for operating system manipulation, dates, regular expressions, JSON files, and system operations.
* tkinter / customtkinter (ctk): Advanced graphical user interface (GUI) creation with theme support and responsiveness.
* docx (python-docx): Manipulation and structuring of Word documents (.docx).
* openpyxl: Manipulation of Excel spreadsheets (.xlsx).
* PIL (Pillow): Image and logo processing and rendering.

## 2. INITIAL CONFIGURATION AND ENVIRONMENT (PyInstaller)

### resource_path(relative_path)

* **Objective:** Resolves the absolute path for system resources (images, configuration files).
* **How it works:** Detects if the script is running as a compressed executable by PyInstaller (via the presence of the `sys._MEIPASS` variable) or in a development environment, ensuring that local files are always found.

### Windows Taskbar Configuration

* Conditional code that uses the native `ctypes` library to set the `AppUserModelID`. This forces Windows to correctly group application windows and display the custom icon on the taskbar.

## 3. CONFIGURATION AND THEME MANAGEMENT

### load_config()

* **Objective:** Loads the operational and visual settings of the program.
* **How it works:** Tries to read the `config.json` file. If it does not exist or fails, it loads a default dictionary containing predefined paths for network servers (J: and M: drives), default color palettes (Light/Dark), font definitions, and accessibility parameters.

### save_config(config)

* **Objective:** Persist configuration changes.
* **How it works:** Writes the current settings back to the `config.json` file in a structured format with UTF-8 encoding.

### apply_custom_theme()

* **Objective:** Customize the visual identity of the interface at runtime.
* **How it works:** Modifies CustomTkinter's global `ThemeManager` by dynamically injecting the hex colors, corner radii (`corner_radius`), and border widths configured by the user.

### get_font(size, bold)

* **Objective:** Abstraction for text rendering with accessibility support.
* **How it works:** Returns a font configuration tuple. If "Dyslexia Mode" is active, it forces the use of the 'Comic Sans MS' font. Otherwise, it uses the default font. It applies zoom multipliers and defines whether the text will be regular or bold.

## 4. DOCUMENT MANIPULATION FUNCTIONS (WORD AND EXCEL)

### date_to_long_text(date)

* Converts a date object (`datetime.date`) to long-form text format in Portuguese (Example: "21 de Maio de 2026").

### find_sheet_by_year(workbook, year)

* Locates the correct tab within the Excel file using regular expressions to find variations that match the year of the memorandum (e.g., "Ofícios Emitidos [Ano]").

### get_next_number(worksheet, year_ref)

* Analyzes the Excel worksheet, searches the identifier column, extracts the highest sequential number recorded for the current year (Number/Year format), and calculates the correct consecutive number for the new memorandum.

### find_last_row(worksheet, column)

* Accurately identifies the last filled row in a specific Excel column, avoiding inconsistencies caused by empty cells with invisible formatting.

### ensure_list_style(doc)

* Injects native OpenXML structures into the Word document to ensure that the numbered list style ("List Number") exists and functions correctly, even if the original template is corrupted or omits this formatting.

### insert_paragraph_after(paragraph, text, style)

* Utility function that manipulates the document's XML tree to insert a new styled paragraph immediately after a reference element.

### replace_tag_in_doc(document, tag, new_text)

* Traverses all text blocks in the Word document (both body paragraphs and cells inside tables) and replaces dynamic tags (e.g., `{{DATA}}`, `{{OFICIO}}`) with the updated content.

### generate_document(officio_number, items, officio_date, save_path)

* Main Word export function. Opens the base file (template), replaces the header tags, locates the `{{LISTA_ITENS}}` tag, removes it, and inserts the formatted items into a numbered list, preserving the template's original fonts.

### add_excel_row(officio_number, year, officio_date, responsible)

* Opens the control spreadsheet, locates the tab corresponding to the year, inserts the metadata of the new memorandum into the first available row, and formats the cells. Contains robust exception handling to alert the user if the file is locked by another user on the network.

## 5. MAIN GRAPHICAL INTERFACE CLASS (`OficioGeneratorApp`)

Manages the main window (`ctk.CTk`), visual components, and user interactions through a tab system.

### Layout Sections (Tabs)

* `setup_generator_tab()`: Builds the issuance form. Includes fields to add items (Name, ID, Remarks, Date, Responsible), a dynamic table with a quick-remove button, and live tracking of the next available number.
* `setup_configuration_tab()`: Parameterization interface to change Word template paths, the Excel database, default directories, and automated suggestion lists.
* `setup_appearance_tab(scroll)`: Aesthetic customization panel where the user can dynamically change background hex colors, buttons, data entries, and focus states.
* `setup_help_tab()`: Integrated operation manual and quick system shortcuts.

### Draft System

* `save_draft()`: Exports the current form data to a local file named `rascunho.json` on every change, preventing data loss in the event of an unexpected shutdown.
* `load_draft()`: Rebuilds the form state from the saved JSON file.
* `auto_check_draft()`: Executed on startup. If it detects a pending draft, it asks the user if they wish to recover their previous work.
* `delete_draft()`: Deletes the `rascunho.json` file after the successful saving of the memorandum.

### Operational Logic and Validations

* `load_next_number()`: Executes an asynchronous read on the Excel sheet to update the next number field in the interface without blocking the user experience.
* `add_item()`: Validates current form fields, inserts the item into the in-memory list, updates the screen view, and transfers keyboard focus to streamline consecutive insertions.
* `remove_item_at_index(idx)`: Removes a specific item from the dynamic list and forces a graphical interface update.
* `generate_document_action()`: Validates the final state of the data, displays a dialog box to choose the save location, invokes the Word and Excel write functions, clears temporary fields, and increments the counter.
* `save_config_from_ui()`: Collects data from configuration fields, validates the entered data types, writes to the JSON file, and securely restarts the application if critical interface changes have been made.
* `_check_config_backup()`: Security mechanism. If the program fails to start after a theme or color change, it automatically restores the `config_backup.json` file.
* `restore_defaults()`: Replaces the current configurations with the factory default values defined in the code.
