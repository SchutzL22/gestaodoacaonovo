import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { DonationStatus, UserRole, CampaignStatus } from '../../domain/enums/index.js';
import { NotificationService } from '../../application/services/NotificationService.js';
import { computeCampaignStatus } from '../../domain/campaignStatus.js';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { AppError } from '../../domain/errors/AppError.js';
import { PasswordHasher } from '../../infrastructure/security/PasswordHasher.js';
import type { Campaign, PriorityItem } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import multer from 'multer';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

const admin = [authMiddleware, requireRoles(UserRole.COPER)];
function ownerOrAdmin(param: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== UserRole.COPER && req.user?.userId !== req.params[param]) {
      throw AppError.forbidden('Acesso restrito ao titular ou à COPER.');
    }
    next();
  };
}

function mapCampaign(c: Campaign & { priorityItems: PriorityItem[] }) {
  const statusEnum = computeCampaignStatus(c.startDate, c.endDate, c.status);
  const status = statusEnum === CampaignStatus.CLOSED ? 'Encerrada'
    : statusEnum === CampaignStatus.FUTURE ? 'Futura' : c.isUrgent ? 'Urgente' : 'Ativa';
  return {
    ...c, titulo: c.title, descricao: c.description, status, statusEnum,
    dataInicio: c.startDate.toISOString().slice(0, 10),
    dataLimite: c.endDate?.toISOString().slice(0, 10) || null,
    limiteHoras: c.hoursLimit, regrasConversao: c.conversionRules, urgente: c.isUrgent,
    itensPrioritarios: c.priorityItems.map(p => ({ ...p, ...mapPriorityItem(p) })),
  };
}

router.get('/campanhas', async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { priorityItems: true }, orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(campaigns.map(mapCampaign));
  } catch (err) { next(err); }
});

router.get('/campanhas/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: String(req.params.id) }, include: { priorityItems: true },
    });
    res.json(mapCampaign(campaign));
  } catch (err) { next(err); }
});

router.post('/campanhas', ...admin, async (req: Request, res: Response, next) => {
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

    res.status(201).json(mapCampaign(created));
  } catch (err) { next(err); }
});

router.put('/campanhas/:id', ...admin, async (req: Request, res: Response, next) => {
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
      if (newEnd && newEnd < newStart) throw AppError.badRequest('Período da campanha inválido.');
      const autoStatus = status === 'Encerrada' ? CampaignStatus.CLOSED : computeCampaignStatus(newStart, newEnd, existing.status);

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

      return res.json(mapCampaign(updated));
    }
    throw AppError.notFound('Campanha não encontrada.');
  } catch (err) { next(err); }
});

router.put('/campanhas/:id/encerrar', ...admin, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.update({
      where: { id: String(req.params.id) }, data: { status: CampaignStatus.CLOSED }, include: { priorityItems: true },
    });
    res.json(mapCampaign(campaign));
  } catch (err) { next(err); }
});

router.delete('/campanhas/:id', ...admin, async (req, res, next) => {
  try {
    await prisma.campaign.delete({ where: { id: String(req.params.id) } });
    res.sendStatus(204);
  } catch (err) { next(err); }
});

function mapPriorityItem(item: { id: string; name: string; goal: number | null; urgencyLevel: string; campaignId: string }) {
  return { id: item.id, nome: item.name, meta: item.goal, urgencia: item.urgencyLevel, campanhaId: item.campaignId };
}

const itemInput = z.object({
  nome: z.string().trim().min(1),
  meta: z.coerce.number().positive().nullable().optional(),
  urgencia: z.enum(['NORMAL', 'MEDIA', 'ALTA']).default('NORMAL'),
  campanhaId: z.string().min(1),
});

router.get('/itens-prioritarios', async (req, res, next) => {
  try {
    const items = await prisma.priorityItem.findMany({ orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }] });
    res.json(items.map(mapPriorityItem));
  } catch (err) { next(err); }
});

router.post('/itens-prioritarios', ...admin, async (req, res, next) => {
  try {
    const item = itemInput.parse(req.body);
    const created = await prisma.priorityItem.create({ data: {
      campaignId: item.campanhaId, name: item.nome, goal: item.meta,
      urgencyLevel: item.urgencia, isUrgent: item.urgencia === 'ALTA',
    } });
    res.status(201).json(mapPriorityItem(created));
  } catch (err) { next(err); }
});

router.put('/itens-prioritarios/:id', ...admin, async (req, res, next) => {
  try {
    const item = itemInput.partial().parse(req.body);
    const updated = await prisma.priorityItem.update({
      where: { id: String(req.params.id) },
      data: { name: item.nome, goal: item.meta, campaignId: item.campanhaId, urgencyLevel: item.urgencia,
        isUrgent: item.urgencia === undefined ? undefined : item.urgencia === 'ALTA' },
    });
    res.json(mapPriorityItem(updated));
  } catch (err) { next(err); }
});

router.delete('/itens-prioritarios/:id', ...admin, async (req, res, next) => {
  try {
    await prisma.priorityItem.delete({ where: { id: String(req.params.id) } });
    res.sendStatus(204);
  } catch (err) { next(err); }
});

router.get('/relatorios', ...admin, async (req: Request, res: Response, next) => {
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const porCampanha = await prisma.$queryRaw<{
      campanha: string; totalDoacoes: number; horasConcedidas: number;
      aprovadas: number; pendentes: number; reprovadas: number;
    }[]>`
      SELECT COALESCE(c.title, 'Sem campanha') AS campanha,
             count(*)::int AS "totalDoacoes",
             COALESCE(sum(d.hours_earned) FILTER (WHERE d.status = 'APPROVED'), 0)::float8 AS "horasConcedidas",
             (count(*) FILTER (WHERE d.status = 'APPROVED'))::int AS aprovadas,
             (count(*) FILTER (WHERE d.status = 'PENDING'))::int AS pendentes,
             (count(*) FILTER (WHERE d.status = 'REJECTED'))::int AS reprovadas
        FROM donations d LEFT JOIN campaigns c ON c.id = d.campaign_id
       WHERE d.created_at >= ${twoYearsAgo}
       GROUP BY c.id, c.title
       ORDER BY "totalDoacoes" DESC, campanha, c.id`;
    res.json({
      totalDoacoes: porCampanha.reduce((sum, c) => sum + c.totalDoacoes, 0),
      totalAprovadas: porCampanha.reduce((sum, c) => sum + c.aprovadas, 0),
      totalReprovadas: porCampanha.reduce((sum, c) => sum + c.reprovadas, 0),
      totalPendentes: porCampanha.reduce((sum, c) => sum + c.pendentes, 0),
      totalHoras: porCampanha.reduce((sum, c) => sum + c.horasConcedidas, 0),
      porCampanha: porCampanha.map(({ campanha, totalDoacoes, horasConcedidas }) => ({
        campanha, totalDoacoes, horasConcedidas,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. NOTIFICAÇÕES ──────────────────────────────────────────
router.get('/notificacoes/aluno/:alunoId', authMiddleware, ownerOrAdmin('alunoId'), (req: Request, res: Response) => {
  const notifs = NotificationService.getUserNotifications(String(req.params.alunoId));
  res.json(notifs);
});

router.get('/notificacoes', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user!.userId;
  const notifs = NotificationService.getUserNotifications(String(userId));
  res.json(notifs);
});

router.patch('/notificacoes/:id/read', authMiddleware, (req: Request, res: Response) => {
  const success = NotificationService.markAsRead(String(req.params.id), (req as AuthenticatedRequest).user!.userId);
  res.json({ success });
});

router.delete('/notificacoes/:id', authMiddleware, (req: Request, res: Response) => {
  NotificationService.deleteNotification(String(req.params.id), (req as AuthenticatedRequest).user!.userId);
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
    matricula: u.matricula,
    role: u.role,
    tipo: isCoper ? 'admin' : isAluno ? 'aluno' : u.role.toLowerCase(),
    saldoHoras: u.totalHoursEarned,
  };
}

router.get('/users', ...admin, async (req: Request, res: Response, next) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const where = role ? { role } : {};
    const users = await prisma.user.findMany({ where, orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios', ...admin, async (req: Request, res: Response, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/alunos', ...admin, async (req: Request, res: Response, next) => {
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

router.get('/usuarios/:id', authMiddleware, ownerOrAdmin('id'), async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

router.put('/usuarios/:id', authMiddleware, ownerOrAdmin('id'), async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const { nome, novaSenha } = z.object({
      nome: z.string().trim().min(3),
      novaSenha: z.string().min(6).optional(),
    }).parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: { name: nome, ...(novaSenha && { passwordHash: await PasswordHasher.hash(novaSenha) }) },
    });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

// ── 6. DOAÇÕES COMPATIBILIDADE (MULTIPART & JSON) ─────────────
router.post('/doacoes', authMiddleware, upload.single('foto'), async (req: Request, res: Response, next) => {
  let evidenceFile: string | undefined;
  try {
    const alunoId = req.body.alunoId ? String(req.body.alunoId) : undefined;
    const matricula = req.body.matricula ? String(req.body.matricula) : '';
    const tipoItem = z.string().trim().min(2).default('Doação Solidária').parse(req.body.tipoItem);
    const categoria = z.string().trim().min(2).default('OUTROS').parse(req.body.categoria);
    const quantidade = z.coerce.number().finite().positive().parse(req.body.quantidade);
    const campanhaId = req.body.campanhaId || req.body.campaignId;
    if (campanhaId) {
      const campaign = await prisma.campaign.findUnique({ where: { id: String(campanhaId) } });
      if (!campaign) throw AppError.notFound('Campanha não encontrada.');
      if (computeCampaignStatus(campaign.startDate, campaign.endDate, campaign.status) !== CampaignStatus.ACTIVE) {
        throw AppError.badRequest('Esta campanha está fora do período de arrecadação.');
      }
    }

    const actor = (req as AuthenticatedRequest).user!;
    let targetUserId = actor.userId;
    if (alunoId || matricula) {
      const student = await prisma.user.findFirst({
        where: { id: alunoId, matricula: matricula || undefined, role: UserRole.ALUNO },
        select: { id: true },
      });
      if (!student) throw AppError.notFound('Aluno não encontrado.');
      if (actor.role !== UserRole.COPER && actor.userId !== student.id) {
        throw AppError.forbidden('Apenas a COPER pode registrar doações em nome de outra pessoa.');
      }
      targetUserId = student.id;
    }

    const id = randomUUID();
    let evidenceUrl: string | null = null;
    if (req.file) {
      const bytes = req.file.buffer;
      const extension = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? 'jpg'
        : bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ? 'png'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
      if (!extension) throw AppError.badRequest('Selecione uma imagem JPEG, PNG ou WebP.');
      evidenceUrl = `/api/donations/${id}/evidence.${extension}`;
      const folder = resolve('uploads', 'evidencias');
      await mkdir(folder, { recursive: true });
      const path = resolve(folder, `${id}.${extension}`);
      await writeFile(path, bytes, { flag: 'wx' });
      evidenceFile = path;
    }

    const donation = await prisma.donation.create({
      data: {
        id,
        evidenceUrl,
        userId: targetUserId,
        status: DonationStatus.PENDING,
        campaignId: campanhaId || null,
        receivedById: actor.role === UserRole.COPER ? actor.userId : null,
        observation: req.body.localEntrega || null,
        hoursEarned: 0,
        items: {
          create: [
            {
              description: tipoItem,
              category: categoria,
              quantity: quantidade,
              unit: 'unidades',
            },
          ],
        },
      },
      include: {
        items: true,
        user: { select: { name: true, matricula: true, email: true } },
        campaign: { select: { id: true, title: true } },
      },
    });

    evidenceFile = undefined;
    res.status(201).json({
      id: donation.id,
      aluno: donation.user.name,
      matricula: donation.user.matricula,
      item: donation.items[0]?.description,
      quantidade: donation.items[0]?.quantity,
      campanha: donation.campaign?.title || null,
      status: 'Pendente',
      data: new Date().toLocaleDateString('pt-BR'),
    });
  } catch (err) {
    if (evidenceFile) await unlink(evidenceFile).catch(() => {});
    next(err);
  }
});

router.put('/doacoes/:id', ...admin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const form = z.object({
      tipoItem: z.string().trim().min(2), quantidade: z.coerce.number().finite().positive(),
      matricula: z.string().trim().optional(), itemId: z.string().optional(),
    }).parse(req.body);
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM donations WHERE id = ${id} FOR UPDATE`;
      const donation = await tx.donation.findUniqueOrThrow({ where: { id }, include: { items: true } });
      if (donation.status !== DonationStatus.PENDING) throw AppError.conflict('Somente doações pendentes podem ser editadas.');
      const item = form.itemId ? donation.items.find(i => i.id === form.itemId) : donation.items[0];
      if (!item) throw AppError.notFound('Item não encontrado nesta doação.');
      if (form.matricula) {
        const student = await tx.user.findUnique({ where: { matricula: form.matricula } });
        if (!student || student.role !== UserRole.ALUNO) throw AppError.notFound('Matrícula não encontrada.');
        if (student.id !== donation.userId) {
          await tx.donation.update({ where: { id }, data: { userId: student.id, donorName: null, donorCpf: null } });
        }
      }
      await tx.donationItem.update({ where: { id: item.id }, data: { description: form.tipoItem, quantity: form.quantidade } });
    });
    res.sendStatus(204);
  } catch (err) { next(err); }
});

router.delete('/doacoes/:id', ...admin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const removed = await prisma.donation.delete({
      where: { id, status: DonationStatus.PENDING }, select: { evidenceUrl: true },
    });
    const ext = removed.evidenceUrl?.match(/\/evidence\.(jpg|png|webp)$/)?.[1];
    if (ext && removed.evidenceUrl === `/api/donations/${id}/evidence.${ext}`) {
      await unlink(resolve('uploads', 'evidencias', `${id}.${ext}`)).catch(err => {
        if (err.code !== 'ENOENT') console.error('Falha ao remover evidência da doação', id);
      });
    }
    res.sendStatus(204);
  } catch (err) { next(err); }
});

router.get('/doacoes', authMiddleware, async (req: Request, res: Response, next) => {
  try {
    const actor = (req as AuthenticatedRequest).user!;
    const donations = await prisma.donation.findMany({
      where: actor.role === UserRole.COPER ? {} : { userId: actor.userId },
      include: {
        items: true,
        user: { select: { name: true, matricula: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      donations.map((d) => ({
        id: d.id,
        data: d.createdAt.toLocaleDateString('pt-BR'),
        aluno: d.user.name,
        matricula: d.user.matricula,
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

router.get('/doacoes/aluno/:alunoId', authMiddleware, ownerOrAdmin('alunoId'), async (req: Request, res: Response, next) => {
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
        user: { select: { name: true, matricula: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      donations.map((d) => ({
        id: d.id,
        data: d.createdAt.toLocaleDateString('pt-BR'),
        aluno: d.user.name,
        matricula: d.user.matricula,
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
