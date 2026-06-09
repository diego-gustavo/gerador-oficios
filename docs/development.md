# Desenvolvimento local

## Requisitos

- Node.js LTS.
- Rust stable.
- Tauri CLI via `@tauri-apps/cli`.
- Windows: Visual Studio Build Tools com componente Visual C++ para fornecer `link.exe`.

## Scripts

- `npm.cmd install`: instala dependencias frontend.
- `npm.cmd run dev`: inicia Vite em `http://127.0.0.1:1420`.
- `npm.cmd run typecheck`: valida TypeScript sem gerar build.
- `npm.cmd run test`: roda testes unitarios TypeScript.
- `npm.cmd run tauri:dev`: abre o app desktop Tauri.
- `npm.cmd run build`: typecheck e build Vite.
- `npm.cmd run tauri:build`: empacota o app desktop.

## Logs tecnicos

Para medir tempos de operacoes principais no console do WebView:

```js
localStorage.setItem("gerador-oficios:debug", "1")
```

Para desativar:

```js
localStorage.removeItem("gerador-oficios:debug")
```

## Estrutura de modulo

Novos modulos devem ser adicionados em `src/modules/registry.ts`. O registro define nome, rota, template, tags obrigatorias, assunto/destino de planilha, colunas Excel e passos de ajuda.

Templates devem ficar em:

```text
src-tauri/resources/templates/{moduleId}/template.docx
```

