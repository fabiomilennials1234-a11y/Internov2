# Sistema Interno MilennialsTECH

Monolito modular para a diretoria acompanhar o que cada pessoa faz e gerir clientes (pós-venda). Este glossário fixa a linguagem do domínio — não é spec nem registro de decisões de implementação.

## Linguagem

### Clientes

**Cliente**:
O agregado central do pós-venda — uma empresa atendida pela MilennialsTECH. É o "card universal": tudo que acontece (menções, eventos, mudanças) converge para a timeline dele. No código: `Cliente`.
_Avoid_: Conta, lead (lead é pré-venda; Cliente é pós-venda), empresa.

**Estágio de entrega**:
A **fase** do cliente no ciclo de vida da entrega — eixo puramente operacional, sem juízo de risco. No código: `Cliente.estagioEntrega`. Não confundir com **Saúde**: um cliente em Onboarding pode estar com saúde Boa ou em Risco.
_Avoid_: Status, situação (status mistura fase com risco — é exatamente o que separamos).

**Saúde**:
O **semáforo** de risco do cliente (Boa / Atenção / Risco) — eixo independente do **Estágio de entrega**. É o sinal que o diretor bate o olho pra saber onde agir. No código: `Cliente.saude`.
_Avoid_: Status, risco (Risco é só um dos valores da Saúde).

**Frente**:
Uma linha de trabalho que a MilennialsTECH toca para um **Cliente**, de um **Tipo de frente** (Marketing / CRM / Vendas / Outro), com **Responsável** e **Status** próprios. Contém **Tarefas**. No código: `Projeto` com `tipo=CLIENTE` e `clienteId` preenchido.
_Avoid_: Projeto (Projeto é o termo de código e abrange também projetos INTERNOS, que **não** são Frentes), workstream, área.

**Status da frente**:
O estado de uma **Frente**: Planejada → Ativa → Pausada → Concluída. Independente do **Estágio de entrega** do Cliente. No código: `Projeto.status`.
_Avoid_: Fase, etapa.

**Responsável**:
O **Usuário** dono de um **Cliente** (responsável geral pelo pós-venda) ou de uma **Frente** (quem toca aquela linha). Dois níveis distintos.
_Avoid_: Dono (Dono é do Board no Kanban — eixo separado), gestor (Gestor é hierarquia de organograma).

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
