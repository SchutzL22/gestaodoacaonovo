import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../infrastructure/database/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { Role, CampaignStatus } from '../../domain/enums/index.js';
import { AppError } from '../../domain/errors/AppError.js';

const router = Router();

/** Calcula o status de uma campanha com base nas datas atuais. */
function computeCampaignStatus(startDate?: Date | null, endDate?: Date | null, currentStatus?: CampaignStatus | string | null): CampaignStatus {
  if (currentStatus === CampaignStatus.CLOSED || currentStatus === 'CLOSED' || currentStatus === 'Encerrada') {
    return CampaignStatus.CLOSED;
  }
  const now = new Date();
  if (startDate && now < startDate) return CampaignStatus.FUTURE;
  if (endDate && now > endDate) return CampaignStatus.CLOSED;
  return CampaignStatus.ACTIVE;
}

const createCampaignSchema = z
  .object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().optional().nullable(),
    hoursLimit: z.number().positive().optional().nullable(),
    conversionRules: z.string().optional().nullable(),
    isUrgent: z.boolean().default(false),
    priorityItems: z
      .array(
        z.object({
          name: z.string().min(2, 'Nome do item prioritário é obrigatório'),
          goal: z.number().positive().optional().nullable(),
          urgencyLevel: z.string().default('NORMAL'),
          isUrgent: z.boolean().default(false),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: 'A data limite deve ser igual ou posterior à data de início.', path: ['endDate'] }
  );

// Para updates, startDate também é opcional (mantém o existente se não enviada)
const updateCampaignSchema = z
  .object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').optional(),
    description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres').optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    hoursLimit: z.number().positive().optional().nullable(),
    conversionRules: z.string().optional().nullable(),
    isUrgent: z.boolean().optional(),
    priorityItems: z
      .array(
        z.object({
          name: z.string().min(2),
          goal: z.number().positive().optional().nullable(),
          urgencyLevel: z.string().default('NORMAL'),
          isUrgent: z.boolean().default(false),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: 'A data limite deve ser igual ou posterior à data de início.', path: ['endDate'] }
  );

const priorityItemSchema = z.object({
  name: z.string().min(2, 'Nome do item é obrigatório'),
  goal: z.number().positive().optional().nullable(),
  urgencyLevel: z.string().default('NORMAL'),
  isUrgent: z.boolean().default(false),
});

// Listar todas as campanhas (Público / Autenticado)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { urgentOnly } = req.query;
    const where: any = {};

    if (urgentOnly === 'true') {
      where.isUrgent = true;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        priorityItems: true,
        _count: { select: { donations: true } },
      },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });

    // Recomputa status com base nas datas (sobrepõe o valor salvo no banco)
    const campaignsWithStatus = campaigns.map((c) => ({
      ...c,
      status: computeCampaignStatus(c.startDate, c.endDate, c.status),
    }));

    res.json({ status: 'success', data: { campaigns: campaignsWithStatus } });
  } catch (err) {
    next(err);
  }
});

// Listar todos os itens prioritários ativos e urgentes (Público)
router.get('/items/priority', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.priorityItem.findMany({
      where: {
        campaign: {
          status: CampaignStatus.ACTIVE,
        },
      },
      include: {
        campaign: {
          select: { id: true, title: true, status: true, isUrgent: true, endDate: true, startDate: true },
        },
      },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ status: 'success', data: { items } });
  } catch (err) {
    next(err);
  }
});

// Obter detalhes de uma campanha por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        priorityItems: true,
        donations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: true, user: { select: { name: true, role: true } } },
        },
      },
    });

    if (!campaign) {
      throw AppError.notFound('Campanha não encontrada.');
    }

    // Retorna com status computado
    const campaignWithStatus = {
      ...campaign,
      status: computeCampaignStatus(campaign.startDate, campaign.endDate, campaign.status),
    };

    res.json({ status: 'success', data: { campaign: campaignWithStatus } });
  } catch (err) {
    next(err);
  }
});

// Criar nova campanha com itens prioritários (Exclusivo COPER / ADMIN)
router.post(
  '/',
  authMiddleware,
  requireRoles(Role.COPER),
  validate({ body: createCampaignSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { priorityItems, startDate, endDate, ...campaignData } = req.body;

      const parsedStartDate = new Date(startDate);
      const parsedEndDate = endDate ? new Date(endDate) : null;

      // Status calculado automaticamente — ignora qualquer valor enviado pelo cliente
      const autoStatus = computeCampaignStatus(parsedStartDate, parsedEndDate);

      const campaign = await prisma.campaign.create({
        data: {
          ...campaignData,
          status: autoStatus,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          priorityItems: priorityItems && priorityItems.length > 0 ? {
            create: priorityItems.map((item: any) => ({
              name: item.name,
              goal: item.goal || null,
              urgencyLevel: item.urgencyLevel || (item.isUrgent ? 'ALTA' : 'NORMAL'),
              isUrgent: Boolean(item.isUrgent),
            })),
          } : undefined,
        },
        include: { priorityItems: true },
      });

      res.status(201).json({
        status: 'success',
        message: 'Campanha criada com sucesso!',
        data: { campaign },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Atualizar campanha (Exclusivo COPER)
router.put(
  '/:id',
  authMiddleware,
  requireRoles(Role.COPER),
  validate({ body: updateCampaignSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const { priorityItems, startDate, endDate, ...data } = req.body;

      const updatePayload: any = { ...data };
      if (startDate !== undefined) updatePayload.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined) updatePayload.endDate = endDate ? new Date(endDate) : null;

      // Busca datas atuais para recalcular status
      const existing = await prisma.campaign.findUnique({ where: { id }, select: { startDate: true, endDate: true } });
      const newStart = updatePayload.startDate ?? existing?.startDate;
      const newEnd = updatePayload.endDate ?? existing?.endDate;
      updatePayload.status = computeCampaignStatus(newStart, newEnd);

      const campaign = await prisma.campaign.update({
        where: { id },
        data: updatePayload,
        include: { priorityItems: true },
      });

      res.json({
        status: 'success',
        message: 'Campanha atualizada com sucesso!',
        data: { campaign },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Encerrar campanha manualmente (Exclusivo COPER)
router.put(
  '/:id/encerrar',
  authMiddleware,
  requireRoles(Role.COPER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const campaign = await prisma.campaign.update({
        where: { id },
        data: { status: CampaignStatus.CLOSED },
        include: { priorityItems: true },
      });
      res.json({ status: 'success', message: 'Campanha encerrada com sucesso.', data: { campaign } });
    } catch (err) {
      next(err);
    }
  }
);

// Adicionar item prioritário à campanha (Exclusivo COPER)
router.post(
  '/:id/items',
  authMiddleware,
  requireRoles(Role.COPER),
  validate({ body: priorityItemSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campaignId = String(req.params.id);
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) throw AppError.notFound('Campanha não encontrada.');

      const item = await prisma.priorityItem.create({
        data: {
          campaignId,
          name: req.body.name,
          goal: req.body.goal || null,
          urgencyLevel: req.body.urgencyLevel || (req.body.isUrgent ? 'ALTA' : 'NORMAL'),
          isUrgent: Boolean(req.body.isUrgent),
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Item prioritário adicionado!',
        data: { item },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Excluir campanha (Exclusivo COPER)
router.delete(
  '/:id',
  authMiddleware,
  requireRoles(Role.COPER),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await prisma.campaign.delete({ where: { id } });
      res.json({ status: 'success', message: 'Campanha excluída com sucesso.' });
    } catch (err) {
      next(err);
    }
  }
);

export { computeCampaignStatus };
export default router;
