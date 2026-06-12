# Release v1.0.0

## Objetivo

Primeira versão operacional do Gerador de Ofícios BRT, com foco no módulo **Achados e Perdidos**.

## Entregas

- Geração de ofício `.docx` a partir de template Word.
- Registro da emissão na planilha Excel configurada.
- Validação antes da geração, com DOCX final publicado apenas após sucesso no Excel.
- Numeração automática por ano a partir da planilha.
- Rascunhos locais com salvar, carregar, renomear e excluir.
- Configurações por módulo: planilha, pasta padrão, template, assunto, destino, colunas e sugestões.
- Tema claro/escuro/sistema, escala de interface e alto contraste.
- Confirmações em modal próprio do app.
- Smoke test com navegador local via `npm.cmd run smoke:browser`.

## Validação Antes do Empacotamento

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run smoke:browser
npm.cmd run build
cd src-tauri
cargo test
cargo check
```

## Empacotamento

```powershell
npm.cmd run tauri:build
```

O instalador é gerado pelo Tauri em `src-tauri/target/release/bundle`.

## Observações Operacionais

- A planilha Excel precisa estar fechada para gravação.
- O template Word precisa conter `{{DATA}}`, `{{OFICIO}}` e `{{LISTA_ITENS}}`.
- Antes de escrever no Excel, o backend cria backup na pasta `.backups` ao lado da planilha.
- Em build release no Windows, o app abre sem janela de CMD.

## Pendências Conhecidas

- Validar textos finais de erro e toast com usuário operacional.
- Rodar `cargo test` e `cargo check` em máquina com Visual Studio Build Tools/MSVC linker instalado.
