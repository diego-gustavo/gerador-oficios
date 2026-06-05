# Gerador de Oficios BRT

Aplicativo desktop Tauri para gerar e registrar oficios operacionais.

## Stack

- Frontend: HTML, CSS e TypeScript puro via Vite.
- Backend: Tauri/Rust para dialogos locais, configuracoes, rascunhos, DOCX e Excel.
- Modulo inicial: `achados-e-perdidos`.

## Rodar frontend em desenvolvimento

O PowerShell deste ambiente pode bloquear `npm.ps1`. Use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

URL local:

```text
http://127.0.0.1:1420
```

## Rodar com Tauri

Requer Rust/Cargo no PATH e WebView2 no Windows.

```powershell
npm.cmd run tauri:dev
```

## Build

```powershell
npm.cmd run build
npm.cmd run tauri:build
```

## Estrutura

```text
src/
  app/          estado global, contexto e rotas
  config/       configuracao padrao e normalizacao
  modules/      regras por modulo de gerador
  pages/        telas renderizadas em HTML/TS
  services/     ponte com comandos Tauri e fallback web
  styles/       CSS da aplicacao
  ui/           helpers de DOM, icones e componentes pequenos
src-tauri/
  resources/    templates empacotados
  src/          backend Rust e comandos Tauri
```

## Arquivos locais

- Configuracoes: `app_data_dir/config.json`.
- Rascunhos: `app_data_dir/drafts/{moduleId}/{draftId}.json`.
- Template empacotado: `src-tauri/resources/templates/achados-e-perdidos/template.docx`.

## Tags do template Word

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`
