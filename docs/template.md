# Template Word

O template padrão fica em:

```text
src-tauri/resources/templates/achados-e-perdidos/template.docx
```

Tags aceitas:

- `{{DATA}}`: data longa em português.
- `{{OFICIO}}`: número do ofício.
- `{{LISTA_ITENS}}`: lista dos itens encontrados.

Mantenha `{{LISTA_ITENS}}` em um parágrafo próprio. Se o parágrafo estiver em uma lista numerada do Word, o backend preserva a numeração do documento.
