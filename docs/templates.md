# Convencao de templates Word

## Tags obrigatorias

O template do modulo Achados e Perdidos deve conter:

- `{{DATA}}`
- `{{OFICIO}}`
- `{{LISTA_ITENS}}`

## Regra importante

As tags devem estar digitadas como texto continuo no Word. Evite aplicar formatacao parcial dentro da tag, porque o Word pode quebrar o texto em multiplos runs no XML interno.

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

## Novos modulos

Cada modulo deve ter seu proprio template em:

```text
src-tauri/resources/templates/{moduleId}/template.docx
```

As tags obrigatorias ficam registradas em `src/modules/registry.ts`.
