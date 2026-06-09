# Checklist de QA manual

## Configuracoes

- Escolher planilha Excel existente.
- Escolher pasta padrao de salvamento.
- Escolher template Word do modulo.
- Alterar e salvar tema claro, escuro e sistema.
- Alterar escala da interface.
- Ativar e desativar alto contraste.
- Restaurar configuracoes padrao e confirmar reset.

## Achados e Perdidos

- Atualizar proximo numero do oficio para o ano atual.
- Trocar ano com `-` e `+`.
- Preencher data manualmente.
- Abrir calendario pelo botao ao lado da data.
- Desbloquear nome do oficio pelo cadeado e editar.
- Bloquear novamente e conferir restauracao do nome padrao.
- Adicionar item com item, marca, descricao e observacao.
- Editar item existente.
- Remover item existente.
- Limpar todos os itens com confirmacao.

## Rascunhos

- Salvar rascunho.
- Listar rascunhos por modulo.
- Buscar rascunho por nome.
- Abrir rascunho.
- Renomear rascunho.
- Excluir rascunho com confirmacao.

## Geracao

- Gerar DOCX com template valido.
- Abrir DOCX gerado e conferir `{{DATA}}`, `{{OFICIO}}` e `{{LISTA_ITENS}}`.
- Conferir registro na planilha nas colunas configuradas.
- Conferir backup criado em `.backups` antes da escrita na planilha.
- Testar erro com planilha aberta/bloqueada.
- Testar erro com template inexistente.
- Testar erro com template sem `{{LISTA_ITENS}}`.

## Layout

- Conferir desktop largo.
- Conferir largura intermediaria.
- Conferir mobile/estreito.
- Navegar somente por teclado.
- Conferir foco visivel em botoes, inputs, selects e links.

