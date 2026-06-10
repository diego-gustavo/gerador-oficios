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

## Contrato de Módulos

- `defineGeneratorModule`: tipa os metadados que aparecem em navegação, ajuda, configurações e registry.
- `defineModuleFixture`: padroniza payload exemplo, tags obrigatórias e nome esperado de documento.
- `validateGeneratorModuleContract`: garante que cada módulo registrado tenha fixture e tags alinhadas.
- `GeneratorModuleAdapter`: contrato das regras puras de cada gerador, com nome padrão e validação.

## Confirmações

- `confirm` em `AppContext`: abre modal próprio e retorna `Promise<boolean>`.
- `ConfirmDialog`: renderiza o modal acessível, fecha com cancelar, confirmar, clique fora ou `Esc`.
- `closeConfirmation`: resolve a promessa pendente e limpa o estado da confirmação.

## Geração Segura

- `validate_lost_found_payload`: valida número, ano, data, responsável e itens no backend.
- `validate_template_before_generation`: verifica se o template Word existe e é arquivo.
- `validate_excel_before_generation`: confere caminho, permissão de escrita, aba do ano e última linha.
- `prepare_docx_save_path`: garante que o destino Word possa ser criado ou substituído.
- `generate_document_and_register_to_paths`: gera DOCX temporário, registra Excel e só então copia para o destino final.

## Smoke Local

- `scripts/smoke-browser.mjs`: sobe `vite preview`, abre Chrome/Edge em modo headless e verifica se a navegação principal aparece no DOM renderizado.
