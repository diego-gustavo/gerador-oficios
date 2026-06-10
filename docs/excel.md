# Planilha Excel

O módulo Achados e Perdidos lê a primeira coluna da aba do ano para descobrir o próximo número de ofício.

Nome esperado da aba:

```text
2026 Ofícios Emitidos
```

O texto precisa conter o ano e algo compatível com `Ofícios Emitidos`.

Campos gravados:

- Número do ofício.
- Assunto.
- Data.
- Destino.
- Responsável.

Antes de escrever, o backend cria backup na pasta `.backups` ao lado da planilha.
