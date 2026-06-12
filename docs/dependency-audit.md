# Auditoria de Dependências

## Frontend

- `react` e `react-dom`: base da interface.
- `@tauri-apps/api`: ponte oficial para `invoke` no app desktop.
- `lucide`: fonte única dos ícones usados em navegação, botões e estados.

## Desenvolvimento Frontend

- `typescript`: checagem estática.
- `vite` e `@vitejs/plugin-react`: build e preview local.
- `vitest`: testes unitários.
- `@types/react` e `@types/react-dom`: tipagem React.
- `@tauri-apps/cli`: comandos de desenvolvimento e build Tauri.

## Backend Rust

- `tauri` e `tauri-build`: runtime desktop.
- `serde` e `serde_json`: contratos JSON entre frontend, config e rascunhos.
- `calamine`: leitura da planilha para descobrir numeração e linhas.
- `umya-spreadsheet`: escrita da planilha Excel.
- `zip`: edição interna do `.docx`.
- `chrono`: datas locais, data longa e timestamps.
- `regex`: leitura flexível de abas, números e tags quebradas pelo Word.
- `rfd`: diálogos nativos de arquivo/pasta.
- `uuid`: ids de rascunhos e nomes temporários seguros.

## Resultado

Não há dependência claramente ociosa no estado atual. O smoke test com navegador local foi implementado sem adicionar Playwright ou outra biblioteca pesada, preservando o tamanho da build.
