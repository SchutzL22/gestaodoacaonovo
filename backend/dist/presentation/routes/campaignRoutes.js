"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const validationMiddleware_js_1 = require("../middlewares/validationMiddleware.js");
const index_js_1 = require("../../domain/enums/index.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const router = (0, express_1.Router)();
const createCampaignSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: zod_1.z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    status: zod_1.z.nativeEnum(index_js_1.CampaignStatus).default(index_js_1.CampaignStatus.ACTIVE),
    startDate: zod_1.z.string().optional().nullable(),
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
});
const updateCampaignSchema = createCampaignSchema.partial();
const priorityItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Nome do item é obrigatório'),
    goal: zod_1.z.number().positive().optional().nullable(),
    urgencyLevel: zod_1.z.string().default('NORMAL'),
    isUrgent: zod_1.z.boolean().default(false),
});
router.get('/', async (req, res, next) => {
    try {
        const { status, urgentOnly } = req.query;
        const where = {};
        if (status && Object.values(index_js_1.CampaignStatus).includes(status)) {
            where.status = status;
        }
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
        res.json({ status: 'success', data: { campaigns } });
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
                    select: { id: true, title: true, status: true, isUrgent: true, endDate: true },
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
                donations: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { items: true, user: { select: { name: true, role: true } } },
                },
            },
        });
        if (!campaign) {
            throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
        }
        res.json({ status: 'success', data: { campaign } });
    }
    catch (err) {
        next(err);
    }
});
router.post('/', authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), (0, validationMiddleware_js_1.validate)({ body: createCampaignSchema }), async (req, res, next) => {
    try {
        const { priorityItems, startDate, endDate, ...campaignData } = req.body;
        const campaign = await prisma_js_1.prisma.campaign.create({
            data: {
                ...campaignData,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
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
