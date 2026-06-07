# Recorrência de eventos via RRULE + exceções

A Agenda substitui o Google Calendar, então precisa de recorrência real (incluindo "toda seg/qua", séries infinitas) e de editar/cancelar uma ocorrência sem afetar a série. Decidimos guardar a regra como string **RRULE (iCalendar RFC 5545)** no evento-mãe (`EventoAgenda.rrule` + `recorrenciaFim`), **expandir as ocorrências no servidor na consulta** dentro da janela pedida, e modelar desvios numa tabela `ExcecaoEvento` identificada por `(eventoId, dataOriginal)` — cancelamento na fase 1, override de campos ("editar só esta") na fase 2.

## Considered Options

- **Recorrência estruturada** (enum freq + intervalo + até): mais simples, mas não cobre múltiplos dias da semana e exigiria retrabalho/mapeamento para RRULE ao integrar com Google Calendar depois.
- **Materializar ocorrências** (gerar N rows por série na criação): consulta trivial, mas explode rows, impede série infinita e torna "editar todas" um UPDATE em massa.

RRULE foi escolhido porque é o padrão que o Google Calendar usa — abre o caminho para sync externo sem migração de dados — e a expansão em tempo de consulta suporta séries infinitas sem materializar nada.

## Consequences

- A leitura da agenda precisa expandir RRULE no servidor por janela `[de, ate]`, aplicando exceções. Custo de CPU por request, não de armazenamento.
- Lembrete de evento recorrente não pode ser um job agendado na criação (série infinita). Resolvido por um **sweeper repeatível** (BullMQ) que varre ocorrências entrando na janela de lookahead; evento único usa job `delayed` direto.
- "Editar todas" altera a regra/evento-mãe; "cancelar/editar esta" cria/atualiza uma `ExcecaoEvento`. A UI precisa perguntar o escopo da edição numa série.
