# Gerador de Ofícios BRT

Aplicativo desktop remasterizado com Tauri, Vite, React e TypeScript.

## Estrutura

- `src/`: interface React.
- `src/modules/`: registro dos geradores plugáveis.
- `src/pages/`: páginas da aplicação.
- `src/services/tauri.ts`: ponte entre React e commands Tauri.
- `src-tauri/src/lib.rs`: backend local em Rust.
- `src-tauri/resources/templates/`: templates empacotados por módulo.

## Rodar em desenvolvimento

O PowerShell deste ambiente pode bloquear `npm.ps1`. Use `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

Para rodar com Tauri:

```powershell
npm.cmd run tauri:dev
```

## Requisitos

- Node.js.
- Rust/Cargo no PATH para compilar o backend Tauri.
- WebView2 no Windows.

## Módulo v1

O primeiro módulo é `achados-e-perdidos`.

Tags esperadas no template Word:

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`

Os rascunhos são salvos por módulo em:

```text
drafts/{moduleId}/*.json
```

No app instalado, esse caminho fica dentro do diretório de dados da aplicação.
