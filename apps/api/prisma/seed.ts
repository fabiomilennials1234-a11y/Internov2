import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await argon2.hash('mudar123');

  const ceo = await prisma.usuario.upsert({
    where: { email: 'gabriel@milennials.tech' },
    update: {},
    create: { nome: 'Gabriel A.', email: 'gabriel@milennials.tech', senhaHash, papel: 'CEO', avatarCor: '#7C6CF6' },
  });

  const diretores = [
    { nome: 'Marina Costa', email: 'marina@milennials.tech', area: 'Comercial', cor: '#f43f5e', board: ['Contas ativas', 'Upsell', 'Renovação', 'Em risco', 'Renovado'] },
    { nome: 'Rafael Teixeira', email: 'rafael@milennials.tech', area: 'Tech', cor: '#0ea5e9', board: ['Backlog', 'Doing', 'Code review', 'QA', 'Deploy'] },
    { nome: 'João Oliveira', email: 'joao@milennials.tech', area: 'Operacional', cor: '#f59e0b', board: ['A planejar', 'Em execução', 'Aprovação cliente', 'Entregue'] },
    { nome: 'Paula Ferraz', email: 'paula@milennials.tech', area: 'Financeiro', cor: '#10b981', board: ['A faturar', 'Enviado', 'Em atraso', 'Pago'] },
    { nome: 'Lara Pinto', email: 'lara@milennials.tech', area: 'People', cor: '#8b5cf6', board: ['Triagem', 'Entrevistas', 'Teste técnico', 'Proposta', 'Onboarding'] },
  ];

  for (const d of diretores) {
    const area = await prisma.area.create({ data: { nome: d.area } });
    const usuario = await prisma.usuario.upsert({
      where: { email: d.email },
      update: {},
      create: { nome: d.nome, email: d.email, senhaHash, papel: 'DIRETOR', areaId: area.id, gestorId: ceo.id, avatarCor: d.cor },
    });
    await prisma.area.update({ where: { id: area.id }, data: { gestorId: usuario.id } });
    await prisma.board.create({
      data: { nome: `Kanban · ${d.area}`, donoId: usuario.id, cor: d.cor, colunas: { create: d.board.map((c, i) => ({ nome: c, ordem: i })) } },
    });
  }

  const marina = await prisma.usuario.findUnique({ where: { email: 'marina@milennials.tech' } });

  const clientes = [
    { nome: 'Clínica Vitalis', emoji: '🏥', estagioEntrega: 'EM_EXECUCAO' as const, valorMensal: 1800000 },
    { nome: 'Loja Norte', emoji: '🛍️', estagioEntrega: 'ATIVO' as const, valorMensal: 1200000 },
    { nome: 'Studio Belle', emoji: '💇', estagioEntrega: 'ONBOARDING' as const, valorMensal: 900000 },
    { nome: 'AgroVerde', emoji: '🌱', estagioEntrega: 'EM_EXECUCAO' as const, saude: 'RISCO' as const, valorMensal: 2500000 },
  ];
  for (const c of clientes) {
    await prisma.cliente.create({ data: { ...c, responsavelId: marina?.id } });
  }

  await prisma.canal.create({ data: { tipo: 'MURAL', nome: 'mural-geral' } });
  await prisma.canal.create({ data: { tipo: 'CANAL', nome: 'comercial' } });
  await prisma.canal.create({ data: { tipo: 'CANAL', nome: 'tech' } });

  console.log('Seed concluído. Login: gabriel@milennials.tech / mudar123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
