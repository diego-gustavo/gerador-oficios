# Gerador de Ofícios BRT

Aplicativo desktop Tauri para gerar e registrar ofícios operacionais.

## Stack

- Frontend: HTML, CSS e TypeScript puro via Vite.
- Backend: Tauri/Rust para diálogos locais, configurações, rascunhos, DOCX e Excel.
- Módulo inicial: `achados-e-perdidos`.

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
  config/       configuração padrão e normalização
  modules/      regras por módulo de gerador
  pages/        telas renderizadas em HTML/TS
  services/     ponte com comandos Tauri e fallback web
  styles/       CSS da aplicacao
  ui/           helpers de DOM, ícones e componentes pequenos
src-tauri/
  resources/    templates empacotados
  src/          backend Rust e comandos Tauri
```

## Arquivos locais

- Configurações: `app_data_dir/config.json`.
- Rascunhos: `app_data_dir/drafts/{moduleId}/{draftId}.json`.
- Template empacotado: `src-tauri/resources/templates/achados-e-perdidos/template.docx`.
- Ícone/favicons: `public/img/favicon.ico` e `public/img/favicon.png`.

## Tags do template Word

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`
