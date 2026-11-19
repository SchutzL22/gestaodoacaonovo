import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { reportFilterSchema } from '../../application/dtos/donation.dto.js';
import { Role } from '../../domain/enums/index.js';
import { AppError } from '../../domain/errors/AppError.js';

const router = Router();
router.use(authMiddleware);

// Relatórios consolidados da COPER e Dashboards de Impacto Social para EMPRESÁRIO
router.get(
  '/consolidated',
  requireRoles(Role.COPER, Role.EMPRESARIO),
  validate({ query: reportFilterSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, status, page = 1, limit = 20 } = req.query as any;

      // Trava de retenção de 2 anos e filtro máximo de 1 ano
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      const parsedEnd = endDate ? new Date(endDate) : now;
      const parsedStart = startDate
        ? new Date(startDate)
        : new Date(parsedEnd.getTime() - 90 * 24 * 60 * 60 * 1000); // Default: 90 dias

      // 1. Regra de retenção: não permite buscar dados com mais de 2 anos
      if (parsedStart < twoYearsAgo) {
        throw AppError.badRequest(
          'Política de retenção: O histórico do sistema está restrito aos últimos 2 anos.'
        );
      }

      // 2. Trava de filtro: limite de consulta de até 1 ano da data da doação
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      if (parsedEnd.getTime() - parsedStart.getTime() > ONE_YEAR_MS) {
        throw AppError.badRequest(
          'Filtro de relatório: O intervalo máximo permitido para consulta nos relatórios consolidados é de até 1 ano.'
        );
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        createdAt: {
          gte: parsedStart,
          lte: parsedEnd,
        },
      };

      if (status && status !== 'ALL') {
        where.status = status;
      }

      // Perfil EMPRESARIO visualiza apenas dados agregados e de impacto social, sem dados sensíveis
      const isEmpresario = req.user?.role === Role.EMPRESARIO;

      const [donations, total, hoursAgg, byStatus, itemsByCategory] = await Promise.all([
        isEmpresario
          ? Promise.resolve([])
          : prisma.donation.findMany({
              where,
              skip,
              take: limitNum,
              orderBy: { createdAt: 'desc' },
              include: {
                items: true,
                user: { select: { id: true, name: true, email: true, role: true, matricula: true } },
                validatedBy: { select: { id: true, name: true } },
                campaign: { select: { id: true, title: true } },
              },
            }),
        prisma.donation.count({ where }),
        prisma.donation.aggregate({
          where: { ...where, status: 'APPROVED' },
          _sum: { hoursEarned: true },
        }),
        prisma.donation.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.donationItem.groupBy({
          by: ['category'],
          where: {
            donation: where,
          },
          _sum: { quantity: true },
          _count: true,
        }),
      ]);

      const statusSummary: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      byStatus.forEach((s) => {
        statusSummary[s.status] = s._count;
      });

      // Cálculo de impacto social estimado (ex: cada 5 itens beneficia em média 1 família/pessoa)
      const totalItemsCount = itemsByCategory.reduce((acc, cat) => acc + (cat._sum.quantity || 0), 0);
      const estimatedBeneficiaries = Math.round(totalItemsCount * 0.4);

      res.json({
        status: 'success',
        data: {
          summary: {
            totalDonations: total,
            ...statusSummary,
            totalHoursGranted: hoursAgg._sum?.hoursEarned || 0,
            totalItemsCollected: totalItemsCount,
            estimatedSocialImpact: {
              beneficiariesAssisted: estimatedBeneficiaries,
              categoriesSummary: itemsByCategory.map((c) => ({
                category: c.category,
                totalQuantity: c._sum.quantity || 0,
                recordsCount: c._count,
              })),
            },
            queryRange: {
              from: parsedStart.toISOString(),
              to: parsedEnd.toISOString(),
            },
            retentionLimitYears: 2,
          },
          donations: isEmpresario ? undefined : donations,
          pagination: isEmpresario
            ? undefined
            : {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
              },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Impacto social exclusivo para EMPRESARIO (dashboard analítico)
router.get(
  '/social-impact',
  requireRoles(Role.EMPRESARIO, Role.COPER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const [approvedCount, hoursAgg, itemsByCategory, topCampaigns] = await Promise.all([
        prisma.donation.count({
          where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
        }),
        prisma.donation.aggregate({
          where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
          _sum: { hoursEarned: true },
        }),
        prisma.donationItem.groupBy({
          by: ['category'],
          where: {
            donation: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
          },
          _sum: { quantity: true },
        }),
        prisma.campaign.findMany({
          take: 5,
          where: { status: 'ACTIVE' },
          include: {
            _count: { select: { donations: true } },
            priorityItems: true,
          },
          orderBy: { isUrgent: 'desc' },
        }),
      ]);

      const totalItems = itemsByCategory.reduce((sum, i) => sum + (i._sum.quantity || 0), 0);

      res.json({
        status: 'success',
        data: {
          period: 'Últimos 12 meses',
          totalApprovedDonations: approvedCount,
          totalHoursVolunteered: hoursAgg._sum?.hoursEarned || 0,
          totalItemsDistributed: totalItems,
          estimatedLivesTouched: Math.round(totalItems * 0.4),
          categoryDistribution: itemsByCategory.map((c) => ({
            category: c.category,
            quantity: c._sum.quantity || 0,
          })),
          activeCampaigns: topCampaigns.map((c) => ({
            id: c.id,
            title: c.title,
            isUrgent: c.isUrgent,
            donationsCount: c._count.donations,
            priorityItemsCount: c.priorityItems.length,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// Limpeza manual da retenção de 2 anos (Exclusivo COPER)
router.post(
  '/retention/cleanup',
  requireRoles(Role.COPER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { cleanupExpiredDonations } = await import('../../infrastructure/jobs/retentionCleanup.js');
      const result = await cleanupExpiredDonations();
      res.json({
        status: 'success',
        message: `Limpeza de retenção (2 anos) concluída. Registros removidos: ${result.deletedCount}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
