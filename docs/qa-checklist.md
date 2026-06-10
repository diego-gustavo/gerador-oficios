# Checklist de QA manual

## Configurações

- No card do módulo Achados e Perdidos, escolher planilha Excel existente.
- No card do módulo Achados e Perdidos, escolher pasta padrão de salvamento.
- No card do módulo Achados e Perdidos, escolher template Word.
- Alterar e salvar tema claro, escuro e sistema.
- Alterar escala da interface.
- Ativar e desativar alto contraste.
- Restaurar configurações padrão e confirmar reset.

## Achados e Perdidos

- Atualizar próximo número do ofício para o ano atual.
- Trocar ano com `-` e `+`.
- Preencher data manualmente.
- Abrir calendário pelo botão ao lado da data.
- Desbloquear nome do ofício pelo cadeado e editar.
- Bloquear novamente e conferir restauração do nome padrão.
- Adicionar item com item, marca, descrição e observação.
- Editar item existente.
- Remover item existente.
- Limpar todos os itens com confirmacao.

## Rascunhos

- Salvar rascunho.
- Listar rascunhos por módulo.
- Buscar rascunho por nome.
- Abrir rascunho.
- Renomear rascunho.
- Excluir rascunho com confirmacao.

## Geração

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

