# Gerador de Ofícios BRT

Aplicativo desktop feito com Tauri, Rust, Vite e React para gerar ofícios operacionais do BRT Sorocaba. O primeiro módulo disponível é **Achados e Perdidos**, que monta o documento Word, registra a emissão na planilha Excel e salva rascunhos locais.

## Stack

- Frontend: React + TypeScript + Vite.
- Visual: React como framework principal, com CSS próprio em `src/styles/app.css`.
- Desktop/backend: Tauri 2 + Rust.
- Documentos: template `.docx` empacotado em `src-tauri/resources/templates`.
- Planilha: leitura com `calamine` e escrita com `umya-spreadsheet`.

## Rodar em Desenvolvimento

No PowerShell, prefira `npm.cmd` para evitar bloqueio de script:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra:

```text
http://127.0.0.1:1420
```

Para rodar como aplicativo Tauri:

```powershell
npm.cmd run tauri:dev
```

## Build

```powershell
npm.cmd run build
npm.cmd run tauri:build
```

## Testes

```powershell
npm.cmd run typecheck
npm.cmd test
cd src-tauri
cargo test
cargo check
```

## Como Usar

1. Abra **Config** e confirme os caminhos da planilha Excel, pasta padrão e template Word.
2. Entre em **Achados**.
3. Confira ano, número do ofício e data.
4. Preencha responsável e adicione os itens encontrados.
5. Use **Salvar rascunho** se precisar continuar depois.
6. Clique em **Gerar ofício** para escolher o arquivo `.docx`, gerar o documento e registrar a linha na planilha.

## Estrutura

```text
src/
  app/          estado global, contexto e rotas
  config/       configuração padrão e normalização
  modules/      regras puras por módulo
  pages/        telas React
  services/     ponte com Tauri e fallback web
  styles/       visual próprio da aplicação
  ui/           componentes e ícones React
src-tauri/
  resources/    templates empacotados
  src/          comandos Tauri e lógica Rust
docs/
  development.md     tutorial das funções e arquitetura
  template.md        como editar templates Word
  excel.md           como configurar a planilha
  new-module.md      como criar novos módulos
  qa-checklist.md    roteiro de validação
  TODO.md            próximos passos
```

## Arquivos Locais

- Configurações: `app_data_dir/config.json`.
- Rascunhos: `app_data_dir/drafts/{moduleId}/{draftId}.json`.
- Template padrão: `src-tauri/resources/templates/achados-e-perdidos/template.docx`.
- Imagens: `public/img`.

## Tags do Template Word

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`

Leia [docs/development.md](docs/development.md) para entender como cada função principal trabalha.
