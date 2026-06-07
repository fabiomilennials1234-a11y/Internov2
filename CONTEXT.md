# Sistema Interno MilennialsTECH

Monolito modular para a diretoria acompanhar o que cada pessoa faz e gerir clientes (pós-venda). Este glossário fixa a linguagem do domínio — não é spec nem registro de decisões de implementação.

## Linguagem

### Agenda

**Agenda**:
Calendário oficial da empresa e fonte da verdade dos compromissos. Substitui o Google Calendar para uso interno. Diretoria vê a agenda de todos por padrão.
_Avoid_: Calendário, schedule.

**Evento**:
Um compromisso com início e fim. Pode ser de **dia-inteiro** ou ter horário, **único** ou **recorrente**, vinculado opcionalmente a um **Cliente**. No código: `EventoAgenda`. O evento recorrente guarda a regra; suas instâncias no tempo são **Ocorrências**.
_Avoid_: Compromisso, reunião (reunião é um tipo de evento, não o termo do modelo), agendamento.

**Ocorrência**:
Uma instância de um **Evento** recorrente em uma data específica. Não é uma row própria — é expandida da regra de recorrência na consulta. Só vira row quando há uma **Exceção**.
_Avoid_: Instância, repetição.

**Exceção**:
Um desvio de uma **Ocorrência** específica de uma série: cancelada, ou com campos sobrescritos ("editar só esta" — título/horário/local/notas; participantes e lembretes seguem a série). No código: `ExcecaoEvento`, identificada por `(eventoId, dataOriginal)`; campos `*Override` nulos herdam da série.
_Avoid_: Override, edição pontual.

**Recorrência**:
A regra que gera as **Ocorrências** de um **Evento**, no padrão RRULE do iCalendar (RFC 5545), guardada no evento-mãe. Ver `docs/adr/0001`.
_Avoid_: Repetição, série (série = o conjunto de ocorrências; recorrência = a regra que as define).

**Participante**:
Um **Usuário** vinculado a um **Evento**, com um **status de RSVP** (convidado / aceito / recusado / talvez). No código: `ParticipanteEvento`.
_Avoid_: Convidado, membro (convidado é só o status inicial do participante).

**Lembrete**:
Um disparo agendado antes do início de uma **Ocorrência** que **notifica** os **Participantes** in-app. Definido por-evento (não por-participante na fase 1). No código: `Lembrete`.
_Avoid_: Alerta, notificação (notificação é o efeito; lembrete é o gatilho temporal).

## Como os termos interagem

> **Dev**: Reunião semanal com o cliente Acme, segunda 10h. Isso é um Evento?
> **Domínio**: Sim — um Evento recorrente. A Recorrência é `FREQ=WEEKLY;BYDAY=MO`. Cada segunda é uma Ocorrência, mas não gravamos uma row por segunda — expandimos a regra na consulta.
> **Dev**: E se cancelar a reunião de uma segunda específica?
> **Domínio**: Aí nasce uma Exceção daquela Ocorrência, marcada como cancelada. A série continua; só aquela data some.
> **Dev**: O lembrete de 10min antes vale pra toda Ocorrência?
> **Domínio**: Vale. O Lembrete é da série. Como ela é potencialmente infinita, um sweeper varre as Ocorrências que entram na janela e notifica os Participantes. O dono define o lembrete; cada Participante recebe a notificação.
> **Dev**: Por estar vinculada ao Cliente Acme, a reunião aparece no card dele?
> **Domínio**: Sim. Ao criar o Evento com cliente, ele emite um evento de domínio que o feed de Atividades consome e grava na timeline do card (ator = criador, alvo = cliente).
