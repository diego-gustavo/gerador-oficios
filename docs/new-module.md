# Novo Módulo

Use este roteiro para criar outro gerador sem misturar regra de negócio, tela e backend.

1. Crie regras puras em `src/modules/<modulo>/`.
2. Tipar adapter, fixture e metadados com `src/modules/contract.ts`.
3. Adicione fixture e testes do módulo.
4. Registre metadados em `src/modules/registry.ts`.
5. Crie página React em `src/pages/`.
6. Adicione rota em `src/app/routes.ts` e tipo em `src/types.ts`.
7. Crie comandos Rust ou expanda comandos existentes em `src-tauri/src/lib.rs`.
8. Adicione template em `src-tauri/resources/templates/<modulo>/`.
9. Rode `npm.cmd test` para validar o contrato do registry, fixtures e tags.

Regra prática: UI chama serviços, serviços chamam Tauri, Tauri grava arquivos. Regras de formatação ficam em módulos puros.
