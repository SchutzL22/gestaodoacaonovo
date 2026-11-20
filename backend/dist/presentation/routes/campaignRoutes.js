"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCampaignStatus = computeCampaignStatus;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const validationMiddleware_js_1 = require("../middlewares/validationMiddleware.js");
const index_js_1 = require("../../domain/enums/index.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const router = (0, express_1.Router)();
function computeCampaignStatus(startDate, endDate, currentStatus) {
    if (currentStatus === index_js_1.CampaignStatus.CLOSED || currentStatus === 'CLOSED' || currentStatus === 'Encerrada') {
        return index_js_1.CampaignStatus.CLOSED;
    }
    const now = new Date();
    if (startDate && now < startDate)
        return index_js_1.CampaignStatus.FUTURE;
    if (endDate && now > endDate)
        return index_js_1.CampaignStatus.CLOSED;
    return index_js_1.CampaignStatus.ACTIVE;
}
const createCampaignSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: zod_1.z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    startDate: zod_1.z.string().min(1, 'Data de início é obrigatória'),
    endDate: zod_1.z.string().optional().nullable(),
    hoursLimit: zod_1.z.number().positive().optional().nullable(),
    conversionRules: zod_1.z.string().optional().nullable(),
    isUrgent: zod_1.z.boolean().default(false),
    priorityItems: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(2, 'Nome do item prioritário é obrigatório'),
        goal: zod_1.z.number().positive().optional().nullable(),
        urgencyLevel: zod_1.z.string().default('NORMAL'),
        isUrgent: zod_1.z.boolean().default(false),
    }))
        .optional(),
})
    .refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, { message: 'A data limite deve ser igual ou posterior à data de início.', path: ['endDate'] });
const updateCampaignSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3, 'Título deve ter no mínimo 3 caracteres').optional(),
    description: zod_1.z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres').optional(),
    startDate: zod_1.z.string().optional().nullable(),
    endDate: zod_1.z.string().optional().nullable(),
    hoursLimit: zod_1.z.number().positive().optional().nullable(),
    conversionRules: zod_1.z.string().optional().nullable(),
    isUrgent: zod_1.z.boolean().optional(),
    priorityItems: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(2),
        goal: zod_1.z.number().positive().optional().nullable(),
        urgencyLevel: zod_1.z.string().default('NORMAL'),
        isUrgent: zod_1.z.boolean().default(false),
    }))
        .optional(),
})
    .refine((data) => {
    if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, { message: 'A data limite deve ser igual ou posterior à data de início.', path: ['endDate'] });
const priorityItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome do item é obrigatório'),
    goal: zod_1.z.number().positive().optional().nullable(),
    urgencyLevel: zod_1.z.string().default('NORMAL'),
    isUrgent: zod_1.z.boolean().default(false),
});
router.get('/', async (req, res, next) => {
    try {
        const { urgentOnly } = req.query;
        const where = {};
        if (urgentOnly === 'true') {
            where.isUrgent = true;
        }
        const campaigns = await prisma_js_1.prisma.campaign.findMany({
            where,
            include: {
                priorityItems: true,
                _count: { select: { donations: true } },
            },
            orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        });
        const campaignsWithStatus = campaigns.map((c) => ({
            ...c,
            status: computeCampaignStatus(c.startDate, c.endDate, c.status),
        }));
        res.json({ status: 'success', data: { campaigns: campaignsWithStatus } });
    }
    catch (err) {
        next(err);
    }
});
router.get('/items/priority', async (req, res, next) => {
    try {
        const items = await prisma_js_1.prisma.priorityItem.findMany({
            where: {
                campaign: {
                    status: index_js_1.CampaignStatus.ACTIVE,
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
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const campaign = await prisma_js_1.prisma.campaign.findUnique({
            where: { id },
            include: {
                priorityItems: true,
                _count: { select: { donations: true } },
            },
        });
        if (!campaign) {
            throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
        }
        const campaignWithStatus = {
            ...campaign,
            status: computeCampaignStatus(campaign.startDate, campaign.endDate, campaign.status),
        };
        res.json({ status: 'success', data: { campaign: campaignWithStatus } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), (0, validationMiddleware_js_1.validate)({ body: createCampaignSchema }), async (req, res, next) => {
    try {
        const { priorityItems, startDate, endDate, ...campaignData } = req.body;
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = endDate ? new Date(endDate) : null;
        const autoStatus = computeCampaignStatus(parsedStartDate, parsedEndDate);
        const campaign = await prisma_js_1.prisma.campaign.create({
            data: {
                ...campaignData,
                status: autoStatus,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                priorityItems: priorityItems && priorityItems.length > 0 ? {
                    create: priorityItems.map((item) => ({
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
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), (0, validationMiddleware_js_1.validate)({ body: updateCampaignSchema }), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { priorityItems, startDate, endDate, ...data } = req.body;
        const updatePayload = { ...data };
        if (startDate !== undefined)
            updatePayload.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined)
            updatePayload.endDate = endDate ? new Date(endDate) : null;
        const existing = await prisma_js_1.prisma.campaign.findUnique({ where: { id }, select: { startDate: true, endDate: true, status: true } });
        if (!existing)
            throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
        const newStart = updatePayload.startDate ?? existing?.startDate;
        const newEnd = endDate === undefined ? existing.endDate : updatePayload.endDate;
        if (!newStart || (newEnd && newEnd < newStart))
            throw AppError_js_1.AppError.badRequest('Período da campanha inválido.');
        updatePayload.status = computeCampaignStatus(newStart, newEnd, existing.status);
        if (priorityItems !== undefined) {
            updatePayload.priorityItems = { deleteMany: {}, create: priorityItems };
        }
        const campaign = await prisma_js_1.prisma.campaign.update({
            where: { id },
            data: updatePayload,
            include: { priorityItems: true },
        });
        res.json({
            status: 'success',
            message: 'Campanha atualizada com sucesso!',
            data: { campaign },
        });
    }
    catch (err) {
        next(err);
    }
});
router.put('/:id/encerrar', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const campaign = await prisma_js_1.prisma.campaign.update({
            where: { id },
            data: { status: index_js_1.CampaignStatus.CLOSED },
            include: { priorityItems: true },
        });
        res.json({ status: 'success', message: 'Campanha encerrada com sucesso.', data: { campaign } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/items', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), (0, validationMiddleware_js_1.validate)({ body: priorityItemSchema }), async (req, res, next) => {
    try {
        const campaignId = String(req.params.id);
        const campaign = await prisma_js_1.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign)
            throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
        const item = await prisma_js_1.prisma.priorityItem.create({
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
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:id', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        await prisma_js_1.prisma.campaign.delete({ where: { id } });
        res.json({ status: 'success', message: 'Campanha excluída com sucesso.' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
