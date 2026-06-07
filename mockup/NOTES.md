# Mockup — decisões validadas (throwaway)

Pergunta: a cara/IA do Sistema Interno bate com a visão do CTO?
Arquivo: `sistema-interno.html` (servir em localhost; é descartável — dobrar no `apps/web` real e deletar).

## Decisões aprovadas pelo CTO

- **Hub = Feed-first.** Home tem o feed "o time agora" como herói (ataca a dor: diretores não sabem o que cada um faz). Navegação fica na sidebar; trilho de produtos é secundário. (Variações Bento/Linear descartadas — switcher só p/ referência.)
- **Clientes = pós-venda.** Cliente já fechou; o sistema gere a ENTREGA/projeto "da porta para dentro". NÃO é funil de prospecção. Status do cliente = estágio de entrega: Onboarding · Em execução · Em revisão · Saudável · Em risco.
- **Clientes tem 2 views:** Tabela (Monday-style) + Board (agrupado por estágio de entrega). Linha/card abre o Card Universal.
- **Card Universal do cliente** aprovado como está: dados + frentes (Marketing/CRM/Vendas = projetos) + timeline com thread inteira do chat (menção @cliente) + equipe + próximos.
- **Visão por Pessoa** aprovada: feed cross-módulo do que a pessoa fez + stats + carga.
- **Kanban por diretor na sidebar** (NÃO dropdown): um board por diretor (Comercial/Tech/Operacional/Financeiro/People), cada um com COLUNAS PRÓPRIAS personalizáveis. Board = entidade com `dono=usuário` + colunas custom ordenáveis (`+ etapa`, `⚙ Etapas`).

## Implicações de modelo de dados (a refletir no §4 / Prisma)

- `Board` (Kanban): dono=Usuario, colunas custom ordenáveis; board pessoal do diretor (workflow interno). Tarefa pertence a Board+Coluna.
- Estágio de entrega do Cliente = enum/status no próprio Cliente (eixo separado do board pessoal).
- "Frentes" do cliente = Projeto vinculado ao Cliente, com tag de tipo (Marketing/CRM/Vendas).
- **Mural↔Card**: unidade de vínculo = `Mensagem` (+ thread de respostas via `threadPaiId`) que contém menção `@cliente` — NÃO o canal inteiro (mural mistura assuntos/clientes). Menção é o gancho; 1 msg pode mencionar N clientes → entra em N cards. Mensagens têm **Responder** (thread), `🔗 conta no card` quando tem @cliente; responder de dentro do card posta de volta no canal de origem. Atividade no card = derivada das menções (não cópia do canal). Telas Comunicação/Agenda/Indicadores/TV também validadas.
