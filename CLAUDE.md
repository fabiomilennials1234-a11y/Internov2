# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Sistema Interno da MilennialsTECH — monolito modular para a diretoria acompanhar o que cada pessoa faz e gerir clientes (pós-venda). Empresa = agência de marketing + SaaS de CRM + consultoria de vendas.

## Comandos

```bash
docker compose up -d                 # postgres + redis local
npm install
npm run db:generate                  # gera Prisma Client (após mudar schema)
npm run db:migrate                   # prisma migrate dev (cria/aplica migration)
npm run db:seed -w @interno/api      # popula diretores, clientes, canais, boards
npm run dev                          # turbo: api :3000 + web :5173

npm run build                        # builda tudo (shared → api → web)
npm run build -w @interno/api        # builda só a API (nest build = typecheck)
npm run build -w @interno/web        # builda só o web (tsc -b + vite build)
npm run db:studio                    # Prisma Studio
```

Login do seed: `gabriel@milennials.tech` / `mudar123`.

Não há runner de teste unitário configurado ainda (jest está nas deps da API; `npm run test -w @interno/api`).

## Arquitetura — monolito modular (regras inegociáveis)

Um deploy, um banco (Supabase/Postgres), um runtime. Dentro, **módulos de domínio isolados** em `apps/api/src/<modulo>`. Princípio do Galego (ver `mockup/NOTES.md` e Obsidian): comunicação intra-monolito é chamada de função/evento in-process, **nunca** protocolo de rede.

- Cada módulo expõe **facade service** pública via barrel `index.ts`. Outro módulo importa SÓ a facade ou um **contrato de evento** de `@interno/shared`.
- **Proibido** importar repositório/entity interno de outro módulo. Acoplamento via `EventEmitter2` (event bus in-process) quando dá.
- Eventos de domínio e seus payloads vivem em `packages/shared/src/eventos.ts` (`EVENTOS.*`). Enums de domínio em `packages/shared/src/dominio.ts`.

### Enums compartilhados — padrão obrigatório

`packages/shared/src/dominio.ts` usa `as const` + union type (NÃO `enum` do TS), espelhando exatamente o que o Prisma Client gera. Isso faz os valores serem assignáveis nos dois sentidos entre módulos e Prisma. Se mudar um enum, mude nos DOIS lugares: `dominio.ts` e `schema.prisma`. `@interno/shared` é resolvido pelo **dist** no `apps/api/tsconfig.json` (build do shared antes da API; turbo cuida via `^build`).

### Espinha dorsal: feed de atividades

`atividades` consome eventos de domínio (`MENCAO_CRIADA`, `CLIENTE_ESTAGIO_ALTERADO`, `TAREFA_ATRIBUIDA`) e grava `Atividade` indexada por **ator (usuário)** e **alvo (cliente)**. Isso alimenta tanto a timeline do card do cliente quanto a visão por pessoa. Módulo de origem só emite o evento — não conhece `atividades`.

### Card universal do cliente

`Cliente` é o agregado central (pós-venda). `Cliente.estagioEntrega` ∈ {ONBOARDING, EM_EXECUCAO, EM_REVISAO, SAUDAVEL, EM_RISCO}. "Frentes" = `Projeto` vinculado ao cliente (Marketing/CRM/Vendas). Menção `@cliente` no chat (`comunicacao`) emite `MENCAO_CRIADA` → entra no card via feed. A unidade de vínculo é a **Mensagem** (+ thread via `threadPaiId`), não o canal.

### Kanban por diretor

`Board` tem `dono = Usuario` e `ColunaBoard` custom ordenáveis. Eixo separado do estágio de entrega do cliente. `Tarefa` pertence a Board+Coluna; atribuir emite `TAREFA_ATRIBUIDA`.

### Realtime / Auth

`RealtimeModule` (global) expõe `RealtimeGateway` (Socket.io) — gateway único para chat, notificações e TV. Salas: `cliente:<id>`, `pessoa:<id>`, `canal:<id>`. Auth próprio (JWT access+refresh, argon2, `RefreshToken` no banco). RBAC via `PapeisGuard` + `@Papeis(...)`; MVP é permissivo (CEO/Diretores veem tudo). `@UsuarioAtual()` injeta o usuário do token.

## Frontend

`apps/web` — React 19 + Vite + react-router 7 + TanStack Query + Tailwind 4 + zustand. Hub é **feed-first** (decisão validada). `src/store/auth.ts` (zustand persistido) guarda tokens; `src/lib/api.ts` injeta o Bearer e desloga no 401. Telas em `src/screens`, casca em `src/components/Layout.tsx` + `Sidebar.tsx`.

## Estado atual / fases

Funcional: auth, pessoas/organograma (F1), clientes+atividades (F2), comunicação/menções (F3), projetos/boards (F4). Backend pronto + stub de tela: agenda (F5), indicadores (F6), dashboards/TV (F7), macros (F8). `mockup/` é throwaway (mockup validado com o CTO) — dobrar no `apps/web` e deletar quando a tela real existir.
