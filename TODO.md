# TODO - Plano de implementacao

Objetivo: recriar o aplicativo `achados-e-perdidos_brt-sorocaba` dentro de `gerador-oficios`, com frontend em HTML, CSS e TypeScript puro, e backend Tauri/Rust para ler, gravar e manipular os arquivos locais.

## Verificacoes executadas

- [x] `npm.cmd install` executado com sucesso.
- [x] `npx.cmd tsc --noEmit` executado com sucesso.
- [x] `npm.cmd run dev` validado com smoke test HTTP 200 em `http://127.0.0.1:1420`.
- [ ] `cargo test` tentou executar, mas ficou bloqueado porque o ambiente nao possui `link.exe`/Visual Studio Build Tools.
- [ ] `cargo check` tentou executar, mas ficou bloqueado pelo mesmo problema de linker.
- [ ] Build/empacotamento final sera validado em outra maquina com acesso de administrador.

## 0. Estado atual encontrado

- [x] Corrigir estrutura de build: `package.json` nao existe, apesar de existir `package-lock.json`.
- [x] Criar ou validar `src-tauri/tauri.conf.json`, pois o projeto Tauri nao tem config visivel.
- [x] Decidir migracao final do frontend: o projeto atual usa React/TSX; o alvo deste plano e HTML/CSS/TS puro.
- [x] Manter como referencia o backend atual em `src-tauri/src/lib.rs`, que ja cobre config, dialogos, rascunhos, Word, Excel e numero do oficio.
- [x] Usar `src-tauri/resources/templates/achados-e-perdidos/template.docx` como template empacotado.

## 1. Paridade funcional com app Python antigo

- [x] Gerador deve calcular proximo oficio lendo a planilha Excel.
- [x] Gerador deve achar aba do ano com padrao `AAAA Oficios Emitidos`, aceitando variacoes com acento.
- [x] Gerador deve criar numero no formato `N/AAAA`.
- [x] Gerador deve validar data `dd/mm/aaaa`.
- [x] Gerador deve exigir responsavel.
- [x] Gerador deve exigir pelo menos 1 item.
- [x] Itens devem seguir formato atualizado: `Item "Marca" - Descricao (Observacao)`.
- [x] Marca deve ser opcional.
- [x] Descricao deve ser opcional.
- [x] Observacao deve ser opcional.
- [x] Lista de sugestoes deve ter altura maxima e scroll.
- [x] Itens adicionados devem poder ser editados.
- [x] Itens adicionados devem poder ser removidos.
- [x] Lista inteira deve poder ser limpa com confirmacao.
- [x] Geracao deve pedir local de salvamento.
- [x] Nome sugerido deve seguir: `AAAA NNN - Encaminhamento de Achados e Perdidos.docx`.
- [x] Campo nome do oficio deve ficar bloqueado por padrao no formato `AAAA NNN - Encaminhamento de Achados e Perdidos`.
- [x] Campo nome do oficio deve ter icone de cadeado para liberar edicao manual.
- [x] Documento Word deve substituir `{{DATA}}`, `{{OFICIO}}` e `{{LISTA_ITENS}}`.
- [x] Data longa no Word deve sair em portugues: `5 de Junho de 2026`.
- [x] Lista de itens no Word deve preservar aparencia do template.
- [x] Registro Excel deve adicionar linha nas colunas:
  - A: numero do oficio
  - B: `Encaminhamento de Achados e Perdidos`
  - C: data `dd/mm/aaaa`
  - D: `Urbes`
  - E: responsavel
- [x] Erro de planilha aberta/bloqueada deve avisar usuario com mensagem clara.
- [x] Depois de gerar com sucesso, limpar formulario e atualizar proximo numero.

## 2. Frontend HTML/CSS/TS puro

- [x] Trocar `index.html` para apontar para `/src/main.ts`.
- [x] Remover React do fluxo final: `src/main.tsx`, `App.tsx`, pages TSX e components TSX viram referencia ou sao migrados.
- [x] Atualizar `vite.config.ts` para Vite sem `@vitejs/plugin-react`.
- [x] Criar estrutura TS pura:
  - `src/main.ts`: bootstrap, shell, toast, aparencia e composicao das telas.
  - `src/app/state.ts`: config, toast, rascunho pendente e estado do gerador.
  - `src/app/routes.ts`: hash routing, titulos e mapas de rota.
  - `src/app/context.ts`: contrato compartilhado entre shell e paginas.
  - `src/pages/*.ts`: geradores, achados-e-perdidos, rascunhos, configuracoes e ajuda.
  - `src/ui/*.ts`: helpers de DOM, icones e componentes HTML pequenos.
  - `src/styles/app.css`: folha principal da aplicacao.
  - `src/services/tauri.ts`: manter ponte Tauri ja existente.
  - `src/modules/lost-found/format.ts`: manter formatacao, validacao de data e ids.
- [x] Recriar layout principal sem React:
  - navegacao lateral/topo
  - area de conteudo
  - toast
  - estado ocupado/desabilitado
  - responsividade desktop/mobile
- [x] Usar icones via pacote `lucide` ou SVGs gerados por TS, sem dependencia React.
- [x] Criar tela `Geradores` com card/linha do modulo Achados e Perdidos.
- [x] Criar tela `Achados e Perdidos`:
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
- [x] Criar tela `Rascunhos`:
  - listar por modulo
  - abrir
  - renomear
  - excluir
- [x] Criar tela `Configuracoes`:
  - caminho da planilha Excel
  - pasta padrao de salvamento
  - template Word do modulo
  - sugestoes em textarea
  - tema: sistema/claro/escuro
  - escala da interface
  - alto contraste
  - botao `Salvar configuracoes` fixo/alinhado a direita
  - botao vermelho para restaurar configuracoes padrao na parte inferior
- [x] Nao recriar opcao `Definir como padrao do app`.
- [x] Nao recriar campo de tipografia.
- [x] Criar tela `Ajuda` curta, baseada no passo a passo do app antigo.
- [x] Aba `Ajuda` deve exibir um card para cada modulo de oficios.

## 3. CSS e UX

- [x] Manter identidade BRT usando logos em `public/img`.
- [x] Garantir tema claro, escuro e alto contraste.
- [x] Usar escala via CSS custom property `--ui-scale`.
- [x] Evitar texto quebrando botoes em telas pequenas.
- [x] Definir dimensoes estaveis para toolbar, lista, botoes e linhas.
- [x] Sugestoes devem ficar em painel com `max-height` e `overflow-y: auto`.
- [x] Estados obrigatorios: vazio, carregando, erro, sucesso, ocupado.
- [x] Confirmar antes de limpar lista, excluir rascunho e redefinir configuracoes de fabrica.
- [x] Confirmar antes de restaurar as configuracoes para o padrao.

## 4. Backend Tauri/Rust

- [x] Revisar comandos atuais:
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
- [x] Garantir que nomes de argumentos usem camelCase no frontend e snake_case aceito no invoke, sem erro de serializacao.
- [x] Melhorar geracao DOCX para lista numerada real quando possivel, nao apenas texto `1. item`.
- [x] Garantir substituicao de tags em `word/document.xml`, headers e footers.
- [ ] Tratar tags quebradas em multiplos runs do Word, ou documentar regra do template.
- [x] Criar erro especifico para template sem `{{LISTA_ITENS}}`.
- [x] Criar erro especifico para template inexistente.
- [x] Criar erro especifico para planilha inexistente.
- [x] Criar erro especifico para planilha aberta/bloqueada.
- [x] Preservar configuracao em `app_data_dir/config.json`.
- [x] Salvar rascunhos em `app_data_dir/drafts/{moduleId}/{draftId}.json`.
- [x] Validar `module_id` para evitar path traversal.
- [x] Empacotar template e icones no build final.

## 5. Configuracao do projeto

- [x] Criar `package.json` com scripts:
  - `dev`: Vite
  - `tauri:dev`: Tauri dev
  - `build`: TypeScript + Vite build
  - `tauri:build`: build desktop
- [x] Instalar dependencias frontend:
  - `@tauri-apps/api`
  - `vite`
  - `typescript`
  - `lucide`
- [x] Instalar dependencias dev:
  - `@tauri-apps/cli`
- [x] Remover dependencias React se frontend puro for confirmado.
- [x] Gerar novo `package-lock.json`.
- [x] Criar `src-tauri/tauri.conf.json` com:
  - nome `Gerador de Oficios BRT`
  - identificador do app
  - icones
  - recursos de template
  - janela inicial
  - comandos/path allowlist necessarios no Tauri v2

## 6. Testes e verificacao

- [x] Testar `npm.cmd install`.
- [x] Testar `npm.cmd run dev`.
- [ ] Testar `npm.cmd run tauri:dev`.
- [ ] Testar `cargo test` ou ao menos `cargo check` em `src-tauri`.
- [x] Criar teste Rust para `long_date_text`.
- [x] Criar teste Rust para `format_lost_found_item`.
- [x] Criar teste Rust para `save_filename`.
- [ ] Criar teste Rust para detectar proximo numero usando planilha fixture.
- [ ] Criar teste/manual QA para gerar DOCX com template.
- [ ] Abrir DOCX gerado e conferir tags substituidas.
- [ ] Conferir planilha depois de `append_excel_row`.
- [ ] Testar erro com planilha aberta.
- [ ] Testar rascunho: salvar, listar, abrir, renomear, excluir.
- [ ] Testar tema claro/escuro/alto contraste.
- [ ] Testar layout em largura desktop e mobile.

## 7. Ordem sugerida de implementacao

- [x] Fase 1: recuperar build minimo (`package.json`, `tauri.conf.json`, scripts).
- [x] Fase 2: migrar frontend React para TS puro mantendo telas existentes como referencia.
- [x] Fase 3: conectar tela Achados e Perdidos aos commands Tauri.
- [x] Fase 4: fechar configuracoes e rascunhos.
- [ ] Fase 5: refinar DOCX/Excel e mensagens de erro.
- [x] Fase 6: CSS, acessibilidade, icones e responsividade.
- [ ] Fase 7: testes, build final e empacotamento.

## 8. Criterios de pronto

- [ ] App abre via `npm.cmd run tauri:dev`.
- [x] Usuario escolhe planilha, template e pasta padrao.
- [ ] App calcula proximo oficio pela planilha real.
- [x] Usuario adiciona, edita e remove itens.
- [x] Sugestoes nao estouram tela.
- [x] Rascunhos funcionam por modulo.
- [ ] App gera DOCX com tags substituidas.
- [ ] App registra linha no Excel.
- [x] App mostra erros claros para arquivo ausente, template invalido e planilha bloqueada.
- [ ] Build final gera executavel com logo/icone.
