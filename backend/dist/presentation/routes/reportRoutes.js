"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const validationMiddleware_js_1 = require("../middlewares/validationMiddleware.js");
const donation_dto_js_1 = require("../../application/dtos/donation.dto.js");
const index_js_1 = require("../../domain/enums/index.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
router.get('/consolidated', (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER, index_js_1.Role.EMPRESARIO), (0, validationMiddleware_js_1.validate)({ query: donation_dto_js_1.reportFilterSchema }), async (req, res, next) => {
    try {
        const { startDate, endDate, status, page = 1, limit = 20 } = req.query;
        const now = new Date();
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(now.getFullYear() - 2);
        const parsedEnd = endDate ? new Date(endDate) : now;
        const parsedStart = startDate
            ? new Date(startDate)
            : new Date(parsedEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (parsedStart < twoYearsAgo) {
            throw AppError_js_1.AppError.badRequest('Política de retenção: O histórico do sistema está restrito aos últimos 2 anos.');
        }
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        if (parsedEnd.getTime() - parsedStart.getTime() > ONE_YEAR_MS) {
            throw AppError_js_1.AppError.badRequest('Filtro de relatório: O intervalo máximo permitido para consulta nos relatórios consolidados é de até 1 ano.');
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(100, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const where = {
            createdAt: {
                gte: parsedStart,
                lte: parsedEnd,
            },
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const isEmpresario = req.user?.role === index_js_1.Role.EMPRESARIO;
        const [donations, total, hoursAgg, byStatus, itemsByCategory] = await Promise.all([
            isEmpresario
                ? Promise.resolve([])
                : prisma_js_1.prisma.donation.findMany({
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
            prisma_js_1.prisma.donation.count({ where }),
            prisma_js_1.prisma.donation.aggregate({
                where: { ...where, status: 'APPROVED' },
                _sum: { hoursEarned: true },
            }),
            prisma_js_1.prisma.donation.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            prisma_js_1.prisma.donationItem.groupBy({
                by: ['category'],
                where: {
                    donation: where,
                },
                _sum: { quantity: true },
                _count: true,
            }),
        ]);
        const statusSummary = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
        byStatus.forEach((s) => {
            statusSummary[s.status] = s._count;
        });
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
    }
    catch (err) {
        next(err);
    }
});
router.get('/social-impact', (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.EMPRESARIO, index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const [approvedCount, hoursAgg, itemsByCategory, topCampaigns] = await Promise.all([
            prisma_js_1.prisma.donation.count({
                where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
            }),
            prisma_js_1.prisma.donation.aggregate({
                where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
                _sum: { hoursEarned: true },
            }),
            prisma_js_1.prisma.donationItem.groupBy({
                by: ['category'],
                where: {
                    donation: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
                },
                _sum: { quantity: true },
            }),
            prisma_js_1.prisma.campaign.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
router.post('/retention/cleanup', (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const { cleanupExpiredDonations } = await import('../../infrastructure/jobs/retentionCleanup.js');
        const result = await cleanupExpiredDonations();
        res.json({
            status: 'success',
            message: `Limpeza de retenção (2 anos) concluída. Registros removidos: ${result.deletedCount}`,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
