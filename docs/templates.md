# Convenção de templates Word

## Tags obrigatorias

O template do módulo Achados e Perdidos deve conter:

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`

## Regra importante

As tags devem estar digitadas como texto continuo no Word. O app tenta recompor tags que o Word quebrou em multiplos runs de texto no XML interno, mas ainda e melhor evitar formatacao parcial dentro da tag para manter o template simples de auditar.

Exemplo valido:

```text
{{LISTA_ITENS}}
```

Exemplo de risco:

```text
{{LISTA_ com parte em negrito ITENS}}
```

## Lista de itens

Se o paragrafo da tag `{{LISTA_ITENS}}` ja tiver numeracao do Word, o app tenta preservar essa numeracao. Caso contrario, gera linhas no formato:

```text
1. Item "Marca" - Descricao (Observacao)
```

## Novos módulos

Cada módulo deve ter seu próprio template em:

```text
src-tauri/resources/templates/{moduleId}/template.docx
```

As tags obrigatórias ficam registradas em `src/modules/registry.ts`.

Não mantenha cópia de `template.docx` na raiz do projeto. O arquivo acima é a origem única usada pelo aplicativo e pelo empacotamento Tauri.
