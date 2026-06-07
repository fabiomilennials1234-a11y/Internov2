# Estágio de entrega ≠ Saúde — dois eixos independentes no Cliente

O `Cliente` carregava dois sinais sobre estado que se sobrepunham: `estagioEntrega` incluía os valores `SAUDAVEL` e `EM_RISCO`, enquanto `saude` ∈ {BOA, ATENCAO, RISCO}. Risco aparecia nos dois lugares. Um diretor batendo o olho no card não sabia qual manda, e mudar de fase forçava reescrever o risco junto (e vice-versa).

Decidimos separar os eixos de forma limpa:

- **Estágio de entrega** = **fase** pura do ciclo de vida (pós-venda): `{ONBOARDING, EM_EXECUCAO, EM_REVISAO, ATIVO, ENCERRADO}`. Sem nenhum valor de risco. `ENCERRADO` é o estado terminal (nunca apagamos o cliente).
- **Saúde** = **semáforo** de risco, único eixo de risco: `{BOA, ATENCAO, RISCO}`.

São ortogonais: um cliente em `ONBOARDING` pode estar com saúde `BOA` ou `RISCO`; um cliente `ATIVO` pode entrar em `ATENCAO` sem mudar de fase.

## Considered Options

- **Colapsar num eixo só** (manter `estagioEntrega` com SAUDAVEL/EM_RISCO, remover `saude`): menos campos, mas acopla fase e risco — não dá pra dizer "cliente em onboarding já em risco", e perde granularidade de risco (3 níveis viram 2 estados misturados na fase).
- **Manter os dois como estavam**: zero migração, mas mantém a sobreposição (SAUDAVEL/EM_RISCO vs BOA/RISCO) — exatamente o ruído que confunde a leitura do card.
- **Eixos separados** (escolhido): cada eixo responde uma pergunta distinta ("em que fase?" vs "está em risco?"), badges independentes, regras de automação futuras (ex.: rebaixar saúde sozinho) não mexem na fase.

## Consequences

- Migração de enum com dados existentes: `SAUDAVEL → ATIVO`; `EM_RISCO → EM_EXECUCAO` **e** `saude = RISCO` (preserva o sinal de risco no eixo certo). Em Postgres exige adicionar os novos valores, migrar as rows e só então remover os antigos.
- Os enums vivem em dois lugares espelhados (`schema.prisma` e `packages/shared/src/dominio.ts`); ambos atualizados.
- Mudar Saúde virou ação própria (`PATCH /clientes/:id/saude`) emitindo `CLIENTE_SAUDE_ALTERADA`, que o feed de Atividades consome — paralelo a `CLIENTE_ESTAGIO_ALTERADO`. A UI mostra dois controles distintos no card e duas colunas/badges na lista.
- `ENCERRADO` como fase terminal sustenta a política "nunca apaga": encerrar é mudar de estágio, não excluir row.
