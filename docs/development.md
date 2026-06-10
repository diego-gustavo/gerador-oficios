# Desenvolvimento

## Arquitetura

- `src/main.tsx`: entrada React, shell, rotas e carregamento inicial.
- `src/app/`: estado global, contexto, mensagens, rotas e logger.
- `src/pages/`: telas React.
- `src/ui/`: componentes visuais pequenos e ícones.
- `src/modules/`: regras puras e testáveis de cada gerador.
- `src/services/tauri.ts`: ponte entre React e comandos Tauri.
- `src/styles/app.css`: visual próprio, sem Bootstrap.
- `src-tauri/src/lib.rs`: backend local em Rust.

## Fluxo Principal

1. React inicia em `main.tsx`.
2. `createInitialState` monta estado padrão.
3. A rota vem do hash da URL.
4. A página altera o estado e chama `renderApp`.
5. Serviços chamam Tauri quando o app roda no desktop.
6. Rust gera DOCX, edita Excel, salva config e rascunhos.

## Funções-Chave

- `createLostFoundState`: estado inicial do módulo.
- `normalizeConfig`: migra e completa configuração.
- `refreshNextOfficio`: consulta/cacheia próximo número.
- `handleGenerate`: valida, gera DOCX, registra Excel e limpa formulário.
- `formatLostFoundItem`: monta texto final de cada item.
- `validateLostFoundPayload`: valida payload antes de gerar.
- `generate_docx_from_template`: substitui tags no DOCX.
- `append_excel_row_to_path`: registra emissão na planilha.
