# Sistema Interno · MilennialsTECH

Monolito modular interno para a diretoria: acompanhar o que cada pessoa faz e gerir clientes (pós-venda) de forma centralizada. Agência de marketing + SaaS de CRM + consultoria de vendas.

## Stack (e por quê)

| Camada | Escolha | Razão |
|--------|---------|-------|
| Monorepo | Turborepo + npm workspaces | um repo, builds incrementais; `apps/*` + `packages/*` |
| Backend | NestJS 11 (TypeScript) | um Nest Module por domínio = monolito modular natural |
| Banco | PostgreSQL (Supabase) | gerenciado; Prisma via pooler (6543) + `DIRECT_URL` (5432) p/ migrations |
| ORM | Prisma 6 | migrations versionadas, type-safe |
| Event bus | `@nestjs/event-emitter` (in-process) | fronteira entre módulos por chamada de função, não rede (princípio do Galego) |
| Filas/jobs | BullMQ + Redis | lembretes de agenda, notificações |
| Realtime | Socket.io | chat/mural, notificações e TV-dashboard compartilham um gateway |
| Auth | JWT + refresh, RBAC próprio | toda query passa pelo backend confiável; RLS opcional |
| Frontend | React 19 + Vite + react-router + TanStack Query + Tailwind 4 + shadcn + zustand | tool interno, sem SSR; convenção da casa |
| Deploy | Easypanel (Docker) | app + Redis; Postgres externo no Supabase |

## Arquitetura — monolito modular

Um deploy, um banco, um runtime. Dentro, **módulos de domínio isolados**. Regras:

- Cada módulo expõe uma **facade service** pública (+ barrel `index.ts`). Outro módulo só conversa por ela ou por **eventos de domínio** (`packages/shared/src/eventos.ts`).
- **Proibido** importar repositório/entity interno de outro módulo.
- Comunicação intra-monolito = chamada de função/evento in-process, nunca protocolo de rede (isso é microsserviço; só valeria com problema de hardware).
- Objetivo: módulos extraíveis no futuro trocando só o transporte.

### Módulos (`apps/api/src/<modulo>`)

`auth` · `pessoas` (usuários/áreas/organograma) · `clientes` (card universal, estágio de entrega) · `atividades` (feed por ator+alvo — espinha dorsal) · `comunicacao` (mural/canais/DM, menções) · `projetos` (boards por diretor, colunas custom) · `agenda` · `indicadores` (OKR/KPI derivados) · `dashboards` (TV) · `macros` · `notificacoes` · `realtime` (gateway Socket.io).

### Conceitos-chave

- **Card Universal do Cliente** = agregado central. Cliente já fechou; gere-se a entrega. `Cliente.estagioEntrega` ∈ {Onboarding, Em execução, Em revisão, Saudável, Em risco}.
- **Frentes** = `Projeto` vinculado ao cliente (Marketing/CRM/Vendas).
- **Kanban por diretor** = `Board` com `dono=Usuário` e **colunas custom ordenáveis**. Eixo separado do estágio de entrega.
- **Menção `@cliente`** no chat é o gancho: a `Mensagem` (+ thread) entra no card daquele cliente via evento → `Atividade`. Não se copia o canal inteiro.
- **Feed de atividades** alimenta o card do cliente E a visão por pessoa, a partir dos mesmos eventos de domínio.

## Rodar local

```bash
cp .env.example .env          # preencha Supabase OU use o bloco docker local
docker compose up -d          # postgres + redis
npm install
npm run db:migrate            # prisma migrate dev
npm run dev                   # turbo: api (3000) + web (5173)
```

### Comandos

- `npm run dev` — sobe API + web
- `npm run build` / `npm run lint` / `npm run test`
- `npm run db:migrate` — migration (Prisma)
- `npm run db:studio` — Prisma Studio
- `npm run db:generate` — regenera Prisma Client

## Fases

F1 pessoas/organograma + auth → F2 clientes + atividades → F3 comunicação/mural → F4 projetos/kanban → F5 agenda → **(fase 2)** F6 indicadores → F7 TV-dashboard → F8 macros.
