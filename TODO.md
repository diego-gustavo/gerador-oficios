# TODO - Plano de implementacao

Objetivo: recriar o aplicativo `achados-e-perdidos_brt-sorocaba` dentro de `gerador-oficios`, com frontend em HTML, CSS e TypeScript puro, e backend Tauri/Rust para ler, gravar e manipular os arquivos locais.

## 0. Estado atual encontrado

- [ ] Corrigir estrutura de build: `package.json` nao existe, apesar de existir `package-lock.json`.
- [ ] Criar ou validar `src-tauri/tauri.conf.json`, pois o projeto Tauri nao tem config visivel.
- [ ] Decidir migracao final do frontend: o projeto atual usa React/TSX; o alvo deste plano e HTML/CSS/TS puro.
- [ ] Manter como referencia o backend atual em `src-tauri/src/lib.rs`, que ja cobre config, dialogos, rascunhos, Word, Excel e numero do oficio.
- [ ] Usar `src-tauri/resources/templates/achados-e-perdidos/template.docx` como template empacotado.

## 1. Paridade funcional com app Python antigo

- [ ] Gerador deve calcular proximo oficio lendo a planilha Excel.
- [ ] Gerador deve achar aba do ano com padrao `AAAA Oficios Emitidos`, aceitando variacoes com acento.
- [ ] Gerador deve criar numero no formato `N/AAAA`.
- [ ] Gerador deve validar data `dd/mm/aaaa`.
- [ ] Gerador deve exigir responsavel.
- [ ] Gerador deve exigir pelo menos 1 item.
- [ ] Itens devem seguir formato atualizado: `Item "Marca" - Descricao (Observacao)`.
- [ ] Marca deve ser opcional.
- [ ] Descricao deve ser opcional.
- [ ] Observacao deve ser opcional.
- [ ] Lista de sugestoes deve ter altura maxima e scroll.
- [ ] Itens adicionados devem poder ser editados.
- [ ] Itens adicionados devem poder ser removidos.
- [ ] Lista inteira deve poder ser limpa com confirmacao.
- [ ] Geracao deve pedir local de salvamento.
- [ ] Nome sugerido deve seguir: `AAAA NNN - Encaminhamento de Achados e Perdidos.docx`.
- [ ] Campo nome do oficio deve ficar bloqueado por padrao no formato `AAAA NNN - Encaminhamento de Achados e Perdidos`.
- [ ] Campo nome do oficio deve ter icone de cadeado para liberar edicao manual.
- [ ] Documento Word deve substituir `{{DATA}}`, `{{OFICIO}}` e `{{LISTA_ITENS}}`.
- [ ] Data longa no Word deve sair em portugues: `5 de Junho de 2026`.
- [ ] Lista de itens no Word deve preservar aparencia do template.
- [ ] Registro Excel deve adicionar linha nas colunas:
  - A: numero do oficio
  - B: `Encaminhamento de Achados e Perdidos`
  - C: data `dd/mm/aaaa`
  - D: `Urbes`
  - E: responsavel
- [ ] Erro de planilha aberta/bloqueada deve avisar usuario com mensagem clara.
- [ ] Depois de gerar com sucesso, limpar formulario e atualizar proximo numero.

## 2. Frontend HTML/CSS/TS puro

- [ ] Trocar `index.html` para apontar para `/src/main.ts`.
- [ ] Remover React do fluxo final: `src/main.tsx`, `App.tsx`, pages TSX e components TSX viram referencia ou sao migrados.
- [ ] Atualizar `vite.config.ts` para Vite sem `@vitejs/plugin-react`.
- [ ] Criar estrutura TS pura:
  - `src/main.ts`: bootstrap, shell, toast, aparencia e composicao das telas.
  - `src/app/state.ts`: config, toast, rascunho pendente e estado do gerador.
  - `src/app/routes.ts`: hash routing, titulos e mapas de rota.
  - `src/app/context.ts`: contrato compartilhado entre shell e paginas.
  - `src/pages/*.ts`: geradores, achados-e-perdidos, rascunhos, configuracoes e ajuda.
  - `src/ui/*.ts`: helpers de DOM, icones e componentes HTML pequenos.
  - `src/styles/app.css`: folha principal da aplicacao.
  - `src/services/tauri.ts`: manter ponte Tauri ja existente.
  - `src/modules/lost-found/format.ts`: manter formatacao, validacao de data e ids.
- [ ] Recriar layout principal sem React:
  - navegacao lateral/topo
  - area de conteudo
  - toast
  - estado ocupado/desabilitado
  - responsividade desktop/mobile
- [ ] Usar icones via pacote `lucide` ou SVGs gerados por TS, sem dependencia React.
- [ ] Criar tela `Geradores` com card/linha do modulo Achados e Perdidos.
- [ ] Criar tela `Achados e Perdidos`:
  - controle de ano `-` e `+`
  - proximo oficio com atualizar
  - data, responsavel, nome do oficio e nome do rascunho
  - botao de calendario ao lado da data do oficio
  - nome do oficio com cadeado e edicao liberada sob demanda
  - combo de item com sugestoes filtradas e scroll
  - campos item, marca, descricao e observacao
  - adicionar/atualizar/cancelar item
  - lista de itens com editar/remover
  - barra de acoes: salvar rascunho, carregar, limpar, gerar oficio
- [ ] Criar tela `Rascunhos`:
  - listar por modulo
  - abrir
  - renomear
  - excluir
- [ ] Criar tela `Configuracoes`:
  - caminho da planilha Excel
  - pasta padrao de salvamento
  - template Word do modulo
  - sugestoes em textarea
  - tema: sistema/claro/escuro
  - escala da interface
  - alto contraste
  - botao `Salvar configuracoes` fixo/alinhado a direita
  - botao vermelho para restaurar configuracoes padrao na parte inferior
- [ ] Nao recriar opcao `Definir como padrao do app`.
- [ ] Nao recriar campo de tipografia.
- [ ] Criar tela `Ajuda` curta, baseada no passo a passo do app antigo.
- [ ] Aba `Ajuda` deve exibir um card para cada modulo de oficios.

## 3. CSS e UX

- [ ] Manter identidade BRT usando logos em `public/img`.
- [ ] Garantir tema claro, escuro e alto contraste.
- [ ] Usar escala via CSS custom property `--ui-scale`.
- [ ] Evitar texto quebrando botoes em telas pequenas.
- [ ] Definir dimensoes estaveis para toolbar, lista, botoes e linhas.
- [ ] Sugestoes devem ficar em painel com `max-height` e `overflow-y: auto`.
- [ ] Estados obrigatorios: vazio, carregando, erro, sucesso, ocupado.
- [ ] Confirmar antes de limpar lista, excluir rascunho e redefinir configurações de fábrica.
- [ ] Confirmar antes de restaurar as configuracoes para o padrao.

## 4. Backend Tauri/Rust

- [ ] Revisar comandos atuais:
  - `load_config`
  - `save_config`
  - `pick_file`
  - `pick_folder`
  - `pick_save_file`
  - `get_default_save_filename`
  - `get_next_officio`
  - `generate_document`
  - `append_excel_row`
  - `list_drafts`
  - `save_draft`
  - `load_draft`
  - `delete_draft`
- [ ] Garantir que nomes de argumentos usem camelCase no frontend e snake_case aceito no invoke, sem erro de serializacao.
- [ ] Melhorar geracao DOCX para lista numerada real quando possivel, nao apenas texto `1. item`.
- [ ] Garantir substituicao de tags em `word/document.xml`, headers e footers.
- [ ] Tratar tags quebradas em multiplos runs do Word, ou documentar regra do template.
- [ ] Criar erro especifico para template sem `{{LISTA_ITENS}}`.
- [ ] Criar erro especifico para template inexistente.
- [ ] Criar erro especifico para planilha inexistente.
- [ ] Criar erro especifico para planilha aberta/bloqueada.
- [ ] Preservar configuracao em `app_data_dir/config.json`.
- [ ] Salvar rascunhos em `app_data_dir/drafts/{moduleId}/{draftId}.json`.
- [ ] Validar `module_id` para evitar path traversal.
- [ ] Empacotar template e icones no build final.

## 5. Configuracao do projeto

- [ ] Criar `package.json` com scripts:
  - `dev`: Vite
  - `tauri:dev`: Tauri dev
  - `build`: TypeScript + Vite build
  - `tauri:build`: build desktop
- [ ] Instalar dependencias frontend:
  - `@tauri-apps/api`
  - `vite`
  - `typescript`
  - `lucide`
- [ ] Instalar dependencias dev:
  - `@tauri-apps/cli`
- [ ] Remover dependencias React se frontend puro for confirmado.
- [ ] Gerar novo `package-lock.json`.
- [ ] Criar `src-tauri/tauri.conf.json` com:
  - nome `Gerador de Oficios BRT`
  - identificador do app
  - icones
  - recursos de template
  - janela inicial
  - comandos/path allowlist necessarios no Tauri v2

## 6. Testes e verificacao

- [ ] Testar `npm.cmd install`.
- [ ] Testar `npm.cmd run dev`.
- [ ] Testar `npm.cmd run tauri:dev`.
- [ ] Testar `cargo test` ou ao menos `cargo check` em `src-tauri`.
- [ ] Criar teste Rust para `long_date_text`.
- [ ] Criar teste Rust para `format_lost_found_item`.
- [ ] Criar teste Rust para `save_filename`.
- [ ] Criar teste Rust para detectar proximo numero usando planilha fixture.
- [ ] Criar teste/manual QA para gerar DOCX com template.
- [ ] Abrir DOCX gerado e conferir tags substituidas.
- [ ] Conferir planilha depois de `append_excel_row`.
- [ ] Testar erro com planilha aberta.
- [ ] Testar rascunho: salvar, listar, abrir, renomear, excluir.
- [ ] Testar tema claro/escuro/alto contraste.
- [ ] Testar layout em largura desktop e mobile.

## 7. Ordem sugerida de implementacao

- [ ] Fase 1: recuperar build minimo (`package.json`, `tauri.conf.json`, scripts).
- [ ] Fase 2: migrar frontend React para TS puro mantendo telas existentes como referencia.
- [ ] Fase 3: conectar tela Achados e Perdidos aos commands Tauri.
- [ ] Fase 4: fechar configuracoes e rascunhos.
- [ ] Fase 5: refinar DOCX/Excel e mensagens de erro.
- [ ] Fase 6: CSS, acessibilidade, icones e responsividade.
- [ ] Fase 7: testes, build final e empacotamento.

## 8. Criterios de pronto

- [ ] App abre via `npm.cmd run tauri:dev`.
- [ ] Usuario escolhe planilha, template e pasta padrao.
- [ ] App calcula proximo oficio pela planilha real.
- [ ] Usuario adiciona, edita e remove itens.
- [ ] Sugestoes nao estouram tela.
- [ ] Rascunhos funcionam por modulo.
- [ ] App gera DOCX com tags substituidas.
- [ ] App registra linha no Excel.
- [ ] App mostra erros claros para arquivo ausente, template invalido e planilha bloqueada.
- [ ] Build final gera executavel com logo/icone.
