# Novo Módulo

Use este roteiro para criar outro gerador sem misturar regra de negócio, tela e backend.

1. Crie regras puras em `src/modules/<modulo>/`.
2. Adicione fixture e testes do módulo.
3. Registre metadados em `src/modules/registry.ts`.
4. Crie página React em `src/pages/`.
5. Adicione rota em `src/app/routes.ts` e tipo em `src/types.ts`.
6. Crie comandos Rust ou expanda comandos existentes em `src-tauri/src/lib.rs`.
7. Adicione template em `src-tauri/resources/templates/<modulo>/`.

Regra prática: UI chama serviços, serviços chamam Tauri, Tauri grava arquivos. Regras de formatação ficam em módulos puros.
