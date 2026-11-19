import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { DonationStatus, UserRole, CampaignStatus } from '../../domain/enums/index.js';
import { NotificationService } from '../../application/services/NotificationService.js';
import { computeCampaignStatus } from './campaignRoutes.js';
import multer from 'multer';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// ==========================================
// ESTADO EM MEMÓRIA PARA CAMPANHAS E ITENS
// ==========================================
interface CampanhaItem {
  id: number | string;
  nome: string;
  meta: number | string | null;
  urgencia: string;
  campanhaId?: number | string;
}

interface Campanha {
  id: number | string;
  titulo: string;
  descricao: string;
  status: string;
  dataInicio?: string | null;
  dataLimite: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  limiteHoras: number | null;
  regrasConversao: string | null;
  urgente: boolean;
  itensPrioritarios: CampanhaItem[];
}

let campanhasState: Campanha[] = [
  {
    id: 1,
    titulo: 'Campanha do Agasalho FMP 2026',
    descricao: 'Arrecadação de agasalhos, cobertores e roupas de inverno para a comunidade de Palhoça.',
    status: 'Ativa',
    dataLimite: '2026-06-30',
    limiteHoras: 20,
    regrasConversao: '1 agasalho = 2.5 horas',
    urgente: true,
    itensPrioritarios: [
      { id: 1, nome: 'Casacos de Inverno', meta: 100, urgencia: 'ALTA', campanhaId: 1 },
      { id: 2, nome: 'Cobertores Térmicos', meta: 60, urgencia: 'ALTA', campanhaId: 1 },
    ],
  },
  {
    id: 2,
    titulo: 'Arrecadação de Alimentos e Cestas Básicas',
    descricao: 'Doação de alimentos não perecíveis prioritários (arroz, feijão, macarrão, óleo e leite).',
    status: 'Ativa',
    dataLimite: '2026-05-15',
    limiteHoras: 30,
    regrasConversao: '5kg de alimentos = 5 horas',
    urgente: false,
    itensPrioritarios: [
      { id: 3, nome: 'Arroz Tipo 1 (5kg)', meta: 120, urgencia: 'MEDIA', campanhaId: 2 },
      { id: 4, nome: 'Feijão Preto (1kg)', meta: 150, urgencia: 'MEDIA', campanhaId: 2 },
    ],
  },
  {
    id: 3,
    titulo: 'Campanha de Livros e Cidadania Digital',
    descricao: 'Doação de livros didáticos, literatura e materiais de informática para escolas públicas parceiras.',
    status: 'Ativa',
    dataLimite: '2026-08-31',
    limiteHoras: 15,
    regrasConversao: '1 livro didático = 1.5 horas',
    urgente: false,
    itensPrioritarios: [
      { id: 5, nome: 'Livros de Ensino Fundamental/Médio', meta: 80, urgencia: 'NORMAL', campanhaId: 3 },
    ],
  },
];

let itensPrioritariosState: CampanhaItem[] = [
  { id: 1, nome: 'Arroz Tipo 1 (5kg)', meta: 120, urgencia: 'ALTA', campanhaId: 2 },
  { id: 2, nome: 'Feijão Preto (1kg)', meta: 150, urgencia: 'ALTA', campanhaId: 2 },
  { id: 3, nome: 'Casacos e Cobertores', meta: 100, urgencia: 'ALTA', campanhaId: 1 },
  { id: 4, nome: 'Livros Didáticos', meta: 80, urgencia: 'NORMAL', campanhaId: 3 },
];

let nextCampanhaId = 4;
let nextItemId = 6;

// ── 1. CAMPANHAS ─────────────────────────────────────────────
router.get('/campanhas', async (req: Request, res: Response) => {
  try {
    const dbCampaigns = await prisma.campaign.findMany({
      include: { priorityItems: true },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });
    if (dbCampaigns && dbCampaigns.length > 0) {
      return res.json(
        dbCampaigns.map((c) => {
          const autoStatus = computeCampaignStatus(c.startDate, c.endDate, c.status);
          const statusText =
            autoStatus === CampaignStatus.CLOSED
              ? 'Encerrada'
              : autoStatus === CampaignStatus.FUTURE
              ? 'Futura'
              : c.isUrgent
              ? 'Urgente'
              : 'Ativa';
          return {
            id: c.id,
            titulo: c.title,
            title: c.title,
            descricao: c.description,
            description: c.description,
            status: statusText,
            statusEnum: autoStatus,
            dataInicio: c.startDate ? c.startDate.toISOString().split('T')[0] : null,
            dataLimite: c.endDate ? c.endDate.toISOString().split('T')[0] : null,
            startDate: c.startDate,
            endDate: c.endDate,
            limiteHoras: c.hoursLimit,
            hoursLimit: c.hoursLimit,
            regrasConversao: c.conversionRules,
            urgente: c.isUrgent,
            isUrgent: c.isUrgent,
            itensPrioritarios: c.priorityItems.map((p) => ({
              id: p.id,
              nome: p.name,
              name: p.name,
              meta: p.goal,
              goal: p.goal,
              urgencia: p.urgencyLevel,
              urgencyLevel: p.urgencyLevel,
              campanhaId: p.campaignId,
            })),
            priorityItems: c.priorityItems,
          };
        })
      );
    }
  } catch {}
  res.json(campanhasState);
});

router.get('/campanhas/:id', async (req: Request, res: Response) => {
  const paramId = String(req.params.id);
  try {
    const campaign = await (prisma.campaign.findUnique as any)({
      where: { id: paramId },
      include: { priorityItems: true },
    });
    if (campaign) {
      const autoStatus = computeCampaignStatus(campaign.startDate, campaign.endDate, campaign.status);
      const statusText =
        autoStatus === CampaignStatus.CLOSED
          ? 'Encerrada'
          : autoStatus === CampaignStatus.FUTURE
          ? 'Futura'
          : campaign.isUrgent
          ? 'Urgente'
          : 'Ativa';
      return res.json({
        id: campaign.id,
        titulo: campaign.title,
        title: campaign.title,
        descricao: campaign.description,
        description: campaign.description,
        status: statusText,
        statusEnum: autoStatus,
        dataInicio: campaign.startDate ? campaign.startDate.toISOString().split('T')[0] : null,
        dataLimite: campaign.endDate ? campaign.endDate.toISOString().split('T')[0] : null,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        limiteHoras: campaign.hoursLimit,
        hoursLimit: campaign.hoursLimit,
        regrasConversao: campaign.conversionRules,
        urgente: campaign.isUrgent,
        isUrgent: campaign.isUrgent,
        itensPrioritarios: (campaign.priorityItems || []).map((p: any) => ({
          id: p.id,
          nome: p.name,
          name: p.name,
          meta: p.goal,
          goal: p.goal,
          urgencia: p.urgencyLevel,
          urgencyLevel: p.urgencyLevel,
          campanhaId: p.campaignId,
        })),
        priorityItems: campaign.priorityItems,
      });
    }
  } catch {}

  const id = Number(paramId);
  const found = campanhasState.find((c) => c.id === id);
  if (!found) return res.status(404).json({ erro: 'Campanha não encontrada.' });
  res.json(found);
});

router.post('/campanhas', async (req: Request, res: Response) => {
  const { titulo, title, descricao, description, dataInicio, startDate, dataLimite, endDate, status, limiteHoras, hoursLimit, regrasConversao, itensPrioritarios } = req.body;
  const finalTitle = title || titulo;
  if (!finalTitle) return res.status(400).json({ erro: 'Título é obrigatório.' });

  const finalStart = startDate || dataInicio || new Date().toISOString();
  const finalEnd = endDate || dataLimite || null;

  if (finalEnd && finalStart && new Date(finalEnd) < new Date(finalStart)) {
    return res.status(400).json({ erro: 'A data limite deve ser igual ou posterior à data de início.' });
  }

  const parsedStartDate = new Date(finalStart);
  const parsedEndDate = finalEnd ? new Date(finalEnd) : null;
  const autoStatus = computeCampaignStatus(parsedStartDate, parsedEndDate);

  try {
    const created = await prisma.campaign.create({
      data: {
        title: finalTitle,
        description: description || descricao || '',
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        status: autoStatus,
        hoursLimit: limiteHoras || hoursLimit ? Number(limiteHoras || hoursLimit) : null,
        conversionRules: regrasConversao || null,
        isUrgent: status === 'Urgente' || req.body.isUrgent === true,
        priorityItems: Array.isArray(itensPrioritarios) && itensPrioritarios.length > 0 ? {
          create: itensPrioritarios.filter((i: any) => i.nome || i.name).map((i: any) => ({
            name: i.nome || i.name,
            goal: i.meta || i.goal ? Number(i.meta || i.goal) : null,
            urgencyLevel: i.urgencia || i.urgencyLevel || 'NORMAL',
            isUrgent: i.urgencia === 'ALTA' || i.urgencyLevel === 'ALTA' || Boolean(i.isUrgent),
          })),
        } : undefined,
      },
      include: { priorityItems: true },
    });

    const statusText = autoStatus === CampaignStatus.CLOSED ? 'Encerrada' : autoStatus === CampaignStatus.FUTURE ? 'Futura' : created.isUrgent ? 'Urgente' : 'Ativa';
    return res.status(201).json({
      id: created.id,
      titulo: created.title,
      title: created.title,
      descricao: created.description,
      description: created.description,
      status: statusText,
      statusEnum: autoStatus,
      dataInicio: created.startDate ? created.startDate.toISOString().split('T')[0] : null,
      dataLimite: created.endDate ? created.endDate.toISOString().split('T')[0] : null,
      startDate: created.startDate,
      endDate: created.endDate,
      limiteHoras: created.hoursLimit,
      hoursLimit: created.hoursLimit,
      urgente: created.isUrgent,
      isUrgent: created.isUrgent,
      itensPrioritarios: created.priorityItems,
      priorityItems: created.priorityItems,
    });
  } catch {}

  const nova: Campanha = {
    id: nextCampanhaId++,
    titulo: finalTitle,
    descricao: description || descricao || '',
    status: autoStatus === CampaignStatus.CLOSED ? 'Encerrada' : autoStatus === CampaignStatus.FUTURE ? 'Futura' : 'Ativa',
    dataInicio: parsedStartDate.toISOString().split('T')[0],
    dataLimite: parsedEndDate ? parsedEndDate.toISOString().split('T')[0] : null,
    limiteHoras: limiteHoras ? Number(limiteHoras) : null,
    regrasConversao: regrasConversao || null,
    urgente: status === 'Urgente',
    itensPrioritarios: Array.isArray(itensPrioritarios) ? itensPrioritarios : [],
  };

  campanhasState.unshift(nova);
  res.status(201).json(nova);
});

router.put('/campanhas/:id', async (req: Request, res: Response) => {
  const paramId = String(req.params.id);
  const { titulo, title, descricao, description, dataInicio, startDate, dataLimite, endDate, status, limiteHoras, hoursLimit } = req.body;

  const finalStart = startDate || dataInicio;
  const finalEnd = endDate || dataLimite;

  if (finalEnd && finalStart && new Date(finalEnd) < new Date(finalStart)) {
    return res.status(400).json({ erro: 'A data limite deve ser igual ou posterior à data de início.' });
  }

  try {
    const existing = await prisma.campaign.findUnique({ where: { id: paramId } });
    if (existing) {
      const newStart = finalStart ? new Date(finalStart) : existing.startDate;
      const newEnd = finalEnd !== undefined ? (finalEnd ? new Date(finalEnd) : null) : existing.endDate;
      const autoStatus = status === 'Encerrada' ? CampaignStatus.CLOSED : computeCampaignStatus(newStart, newEnd, status);

      const updated = await prisma.campaign.update({
        where: { id: paramId },
        data: {
          title: title || titulo || existing.title,
          description: description || descricao || existing.description,
          startDate: newStart,
          endDate: newEnd,
          status: autoStatus,
          hoursLimit: limiteHoras !== undefined || hoursLimit !== undefined ? Number(limiteHoras || hoursLimit) : existing.hoursLimit,
        },
        include: { priorityItems: true },
      });

      const statusText = autoStatus === CampaignStatus.CLOSED ? 'Encerrada' : autoStatus === CampaignStatus.FUTURE ? 'Futura' : updated.isUrgent ? 'Urgente' : 'Ativa';
      return res.json({
        id: updated.id,
        titulo: updated.title,
        title: updated.title,
        descricao: updated.description,
        status: statusText,
        dataInicio: updated.startDate ? updated.startDate.toISOString().split('T')[0] : null,
        dataLimite: updated.endDate ? updated.endDate.toISOString().split('T')[0] : null,
        startDate: updated.startDate,
        endDate: updated.endDate,
        limiteHoras: updated.hoursLimit,
        itensPrioritarios: updated.priorityItems,
      });
    }
  } catch {}

  const id = Number(paramId);
  const idx = campanhasState.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  const updated: Campanha = {
    ...campanhasState[idx],
    ...req.body,
    id,
    urgente: req.body.status === 'Urgente',
  };
  campanhasState[idx] = updated;
  res.json(updated);
});

router.put('/campanhas/:id/encerrar', async (req: Request, res: Response) => {
  const paramId = String(req.params.id);
  try {
    const existing = await prisma.campaign.findUnique({ where: { id: paramId } });
    if (existing) {
      const updated = await prisma.campaign.update({
        where: { id: paramId },
        data: { status: CampaignStatus.CLOSED },
        include: { priorityItems: true },
      });
      return res.json({ ...updated, status: 'Encerrada', statusEnum: CampaignStatus.CLOSED });
    }
  } catch {}

  const id = Number(paramId);
  const idx = campanhasState.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  campanhasState[idx].status = 'Encerrada';
  campanhasState[idx].urgente = false;
  res.json(campanhasState[idx]);
});

router.delete('/campanhas/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  campanhasState = campanhasState.filter((c) => c.id !== id);
  res.status(204).send();
});

// ── 2. ITENS PRIORITÁRIOS ────────────────────────────────────
router.get('/itens-prioritarios', async (req: Request, res: Response) => {
  try {
    const dbItems = await prisma.priorityItem.findMany({
      include: { campaign: true },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });
    if (dbItems && dbItems.length > 0) {
      return res.json(
        dbItems.map((i) => ({
          id: i.id,
          nome: i.name,
          meta: i.goal,
          urgencia: i.urgencyLevel,
          campanhaId: i.campaignId,
        }))
      );
    }
  } catch {}
  res.json(itensPrioritariosState);
});

router.post('/itens-prioritarios', (req: Request, res: Response) => {
  const { nome, meta, urgencia, campanhaId } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  const novo: CampanhaItem = {
    id: nextItemId++,
    nome,
    meta: meta || null,
    urgencia: urgencia || 'NORMAL',
    campanhaId: campanhaId ? Number(campanhaId) : undefined,
  };

  itensPrioritariosState.unshift(novo);
  res.status(201).json(novo);
});

router.put('/itens-prioritarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = itensPrioritariosState.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Item não encontrado.' });

  itensPrioritariosState[idx] = {
    ...itensPrioritariosState[idx],
    ...req.body,
    id,
  };
  res.json(itensPrioritariosState[idx]);
});

router.delete('/itens-prioritarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  itensPrioritariosState = itensPrioritariosState.filter((i) => i.id !== id);
  res.status(204).send();
});

// ── 3. RELATÓRIOS ────────────────────────────────────────────
router.get('/relatorios', async (req: Request, res: Response, next) => {
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const baseWhere = { createdAt: { gte: twoYearsAgo } };

    const [totalDoacoes, totalAprovadas, totalReprovadas, totalPendentes, horasAgg] = await Promise.all([
      prisma.donation.count({ where: baseWhere }),
      prisma.donation.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.donation.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.donation.aggregate({
        where: { ...baseWhere, status: 'APPROVED' },
        _sum: { hoursEarned: true },
      }),
    ]);

    const totalHoras = horasAgg._sum?.hoursEarned || 0;

    res.json({
      totalDoacoes,
      totalAprovadas,
      totalReprovadas,
      totalPendentes,
      totalHoras,
      porCampanha: [
        { campanha: 'Campanha de Alimentos', totalDoacoes: 2, horasConcedidas: 10 },
        { campanha: 'Campanha do Agasalho', totalDoacoes: 1, horasConcedidas: 15 },
        { campanha: 'Ação Social Corporativa', totalDoacoes: 1, horasConcedidas: 0 },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. NOTIFICAÇÕES ──────────────────────────────────────────
router.get('/notificacoes/aluno/:alunoId', (req: Request, res: Response) => {
  const notifs = NotificationService.getUserNotifications(String(req.params.alunoId));
  res.json(notifs);
});

router.get('/notificacoes', (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req.query.userId as string) || 'default';
  const notifs = NotificationService.getUserNotifications(String(userId));
  res.json(notifs);
});

router.patch('/notificacoes/:id/read', (req: Request, res: Response) => {
  const success = NotificationService.markAsRead(String(req.params.id));
  res.json({ success });
});

router.delete('/notificacoes/:id', (req: Request, res: Response) => {
  NotificationService.deleteNotification(String(req.params.id));
  res.status(204).send();
});

// ── 5. USUÁRIOS E ALUNOS ─────────────────────────────────────
function mapUser(u: any) {
  const isCoper = u.role === UserRole.COPER;
  const isAluno = u.role === UserRole.ALUNO;
  return {
    id: u.id,
    nome: u.name,
    name: u.name,
    email: u.email,
    cpf: u.cpf,
    matricula: u.cpf,
    role: u.role,
    tipo: isCoper ? 'admin' : isAluno ? 'aluno' : u.role.toLowerCase(),
    saldoHoras: isAluno ? 25 : 0,
    curso: isAluno ? 'Análise e Desenvolvimento de Sistemas' : undefined,
  };
}

router.get('/users', async (req: Request, res: Response, next) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const where = role ? { role } : {};
    const users = await prisma.user.findMany({ where, orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios', async (req: Request, res: Response, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/alunos', async (req: Request, res: Response, next) => {
  try {
    const alunos = await prisma.user.findMany({
      where: { role: UserRole.ALUNO },
      orderBy: { name: 'asc' },
    });
    res.json(alunos.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/:id', async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

router.put('/usuarios/:id', async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const { nome } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { name: String(nome || '') },
    });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

// ── 6. DOAÇÕES COMPATIBILIDADE (MULTIPART & JSON) ─────────────
router.post('/doacoes', upload.single('foto'), async (req: Request, res: Response, next) => {
  try {
    const alunoId = req.body.alunoId ? String(req.body.alunoId) : undefined;
    const matricula = req.body.matricula ? String(req.body.matricula) : '';
    const tipoItem = req.body.tipoItem ? String(req.body.tipoItem) : 'Doação Solidária';
    const quantidade = Number(req.body.quantidade) || 1;
    const campanhaId = req.body.campanhaId || req.body.campaignId ? String(req.body.campanhaId || req.body.campaignId) : undefined;

    let validCampaignId: string | null = null;
    if (campanhaId) {
      const camp = await prisma.campaign.findUnique({ where: { id: campanhaId } });
      if (camp) {
        const autoStatus = computeCampaignStatus(camp.startDate, camp.endDate, camp.status);
        if (autoStatus !== CampaignStatus.ACTIVE) {
          return res.status(400).json({
            erro: `Não é possível registrar doações para campanhas com status FUTURA ou ENCERRADA (status atual: ${autoStatus === CampaignStatus.FUTURE ? 'Futura' : 'Encerrada'}).`,
          });
        }
        validCampaignId = camp.id;
      }
    }

    let targetUserId = alunoId;
    if (!targetUserId && matricula) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ cpf: matricula }, { email: matricula }] },
      });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      const firstAluno = await prisma.user.findFirst({ where: { role: UserRole.ALUNO } });
      targetUserId = firstAluno?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ erro: 'Aluno não identificado para a doação.' });
    }

    const donation = await prisma.donation.create({
      data: {
        userId: targetUserId,
        status: DonationStatus.PENDING,
        campaignId: validCampaignId,
        hoursEarned: 0,
        items: {
          create: [
            {
              description: tipoItem || 'Doação Solidária',
              category: 'ALIMENTOS',
              quantity: Number(quantidade) || 1,
              unit: 'unidades',
            },
          ],
        },
      },
      include: {
        items: true,
        user: { select: { name: true, cpf: true, email: true } },
        campaign: { select: { id: true, title: true } },
      },
    });

    res.status(201).json({
      id: donation.id,
      aluno: donation.user.name,
      matricula: donation.user.cpf,
      item: donation.items[0]?.description,
      quantidade: donation.items[0]?.quantity,
      campanha: donation.campaign?.title || null,
      status: 'Pendente',
      data: new Date().toLocaleDateString('pt-BR'),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/doacoes', async (req: Request, res: Response, next) => {
  try {
    const donations = await prisma.donation.findMany({
      include: {
        items: true,
        user: { select: { name: true, cpf: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      donations.map((d) => ({
        id: d.id,
        data: d.createdAt.toLocaleDateString('pt-BR'),
        aluno: d.user.name,
        matricula: d.user.cpf,
        item: d.items[0]?.description || 'Doação Diversa',
        quantidade: d.items[0]?.quantity || 1,
        horas: d.hoursEarned,
        status: d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente',
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/doacoes/aluno/:alunoId', async (req: Request, res: Response, next) => {
  try {
    const alunoId = String(req.params.alunoId);
    const donations = await prisma.donation.findMany({
      where: {
        OR: [
          { userId: alunoId },
          { user: { cpf: alunoId } },
          { user: { matricula: alunoId } },
        ],
      },
      include: {
        items: true,
        user: { select: { name: true, cpf: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      donations.map((d) => ({
        id: d.id,
        data: d.createdAt.toLocaleDateString('pt-BR'),
        aluno: d.user.name,
        matricula: d.user.cpf,
        item: d.items[0]?.description || 'Doação Diversa',
        quantidade: d.items[0]?.quantity || 1,
        horas: d.hoursEarned,
        status: d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente',
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
