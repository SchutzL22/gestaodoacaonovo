"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const index_js_1 = require("../../domain/enums/index.js");
const NotificationService_js_1 = require("../../application/services/NotificationService.js");
const campaignRoutes_js_1 = require("./campaignRoutes.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const PasswordHasher_js_1 = require("../../infrastructure/security/PasswordHasher.js");
const zod_1 = require("zod");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ limits: { fileSize: 10 * 1024 * 1024 } });
const router = (0, express_1.Router)();
const admin = [authMiddleware_js_1.authMiddleware, (0, rbacMiddleware_js_1.requireRoles)(index_js_1.UserRole.COPER)];
function ownerOrAdmin(param) {
    return (req, res, next) => {
        if (req.user?.role !== index_js_1.UserRole.COPER && req.user?.userId !== req.params[param]) {
            throw AppError_js_1.AppError.forbidden('Acesso restrito ao titular ou à COPER.');
        }
        next();
    };
}
function mapCampaign(c) {
    const statusEnum = (0, campaignRoutes_js_1.computeCampaignStatus)(c.startDate, c.endDate, c.status);
    const status = statusEnum === index_js_1.CampaignStatus.CLOSED ? 'Encerrada'
        : statusEnum === index_js_1.CampaignStatus.FUTURE ? 'Futura' : c.isUrgent ? 'Urgente' : 'Ativa';
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
        const campaigns = await prisma_js_1.prisma.campaign.findMany({
            include: { priorityItems: true }, orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        });
        res.json(campaigns.map(mapCampaign));
    }
    catch (err) {
        next(err);
    }
});
router.get('/campanhas/:id', async (req, res, next) => {
    try {
        const campaign = await prisma_js_1.prisma.campaign.findUniqueOrThrow({
            where: { id: String(req.params.id) }, include: { priorityItems: true },
        });
        res.json(mapCampaign(campaign));
    }
    catch (err) {
        next(err);
    }
});
router.post('/campanhas', ...admin, async (req, res, next) => {
    const { titulo, title, descricao, description, dataInicio, startDate, dataLimite, endDate, status, limiteHoras, hoursLimit, regrasConversao, itensPrioritarios } = req.body;
    const finalTitle = title || titulo;
    if (!finalTitle)
        return res.status(400).json({ erro: 'Título é obrigatório.' });
    const finalStart = startDate || dataInicio || new Date().toISOString();
    const finalEnd = endDate || dataLimite || null;
    if (finalEnd && finalStart && new Date(finalEnd) < new Date(finalStart)) {
        return res.status(400).json({ erro: 'A data limite deve ser igual ou posterior à data de início.' });
    }
    const parsedStartDate = new Date(finalStart);
    const parsedEndDate = finalEnd ? new Date(finalEnd) : null;
    const autoStatus = (0, campaignRoutes_js_1.computeCampaignStatus)(parsedStartDate, parsedEndDate);
    try {
        const created = await prisma_js_1.prisma.campaign.create({
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
                    create: itensPrioritarios.filter((i) => i.nome || i.name).map((i) => ({
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
    }
    catch (err) {
        next(err);
    }
});
router.put('/campanhas/:id', ...admin, async (req, res, next) => {
    const paramId = String(req.params.id);
    const { titulo, title, descricao, description, dataInicio, startDate, dataLimite, endDate, status, limiteHoras, hoursLimit } = req.body;
    const finalStart = startDate || dataInicio;
    const finalEnd = endDate || dataLimite;
    if (finalEnd && finalStart && new Date(finalEnd) < new Date(finalStart)) {
        return res.status(400).json({ erro: 'A data limite deve ser igual ou posterior à data de início.' });
    }
    try {
        const existing = await prisma_js_1.prisma.campaign.findUnique({ where: { id: paramId } });
        if (existing) {
            const newStart = finalStart ? new Date(finalStart) : existing.startDate;
            const newEnd = finalEnd !== undefined ? (finalEnd ? new Date(finalEnd) : null) : existing.endDate;
            const autoStatus = status === 'Encerrada' ? index_js_1.CampaignStatus.CLOSED : (0, campaignRoutes_js_1.computeCampaignStatus)(newStart, newEnd, status);
            const updated = await prisma_js_1.prisma.campaign.update({
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
        throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
    }
    catch (err) {
        next(err);
    }
});
router.put('/campanhas/:id/encerrar', ...admin, async (req, res, next) => {
    try {
        const campaign = await prisma_js_1.prisma.campaign.update({
            where: { id: String(req.params.id) }, data: { status: index_js_1.CampaignStatus.CLOSED }, include: { priorityItems: true },
        });
        res.json(mapCampaign(campaign));
    }
    catch (err) {
        next(err);
    }
});
router.delete('/campanhas/:id', ...admin, async (req, res, next) => {
    try {
        await prisma_js_1.prisma.campaign.delete({ where: { id: String(req.params.id) } });
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
function mapPriorityItem(item) {
    return { id: item.id, nome: item.name, meta: item.goal, urgencia: item.urgencyLevel, campanhaId: item.campaignId };
}
const itemInput = zod_1.z.object({
    nome: zod_1.z.string().trim().min(1),
    meta: zod_1.z.coerce.number().positive().nullable().optional(),
    urgencia: zod_1.z.enum(['NORMAL', 'MEDIA', 'ALTA']).default('NORMAL'),
    campanhaId: zod_1.z.string().min(1),
});
router.get('/itens-prioritarios', async (req, res, next) => {
    try {
        const items = await prisma_js_1.prisma.priorityItem.findMany({ orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }] });
        res.json(items.map(mapPriorityItem));
    }
    catch (err) {
        next(err);
    }
});
router.post('/itens-prioritarios', ...admin, async (req, res, next) => {
    try {
        const item = itemInput.parse(req.body);
        const created = await prisma_js_1.prisma.priorityItem.create({ data: {
                campaignId: item.campanhaId, name: item.nome, goal: item.meta,
                urgencyLevel: item.urgencia, isUrgent: item.urgencia === 'ALTA',
            } });
        res.status(201).json(mapPriorityItem(created));
    }
    catch (err) {
        next(err);
    }
});
router.put('/itens-prioritarios/:id', ...admin, async (req, res, next) => {
    try {
        const item = itemInput.partial().parse(req.body);
        const updated = await prisma_js_1.prisma.priorityItem.update({
            where: { id: String(req.params.id) },
            data: { name: item.nome, goal: item.meta, campaignId: item.campanhaId, urgencyLevel: item.urgencia,
                isUrgent: item.urgencia === undefined ? undefined : item.urgencia === 'ALTA' },
        });
        res.json(mapPriorityItem(updated));
    }
    catch (err) {
        next(err);
    }
});
router.delete('/itens-prioritarios/:id', ...admin, async (req, res, next) => {
    try {
        await prisma_js_1.prisma.priorityItem.delete({ where: { id: String(req.params.id) } });
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
router.get('/relatorios', ...admin, async (req, res, next) => {
    try {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const baseWhere = { createdAt: { gte: twoYearsAgo } };
        const [totalDoacoes, totalAprovadas, totalReprovadas, totalPendentes, horasAgg] = await Promise.all([
            prisma_js_1.prisma.donation.count({ where: baseWhere }),
            prisma_js_1.prisma.donation.count({ where: { ...baseWhere, status: 'APPROVED' } }),
            prisma_js_1.prisma.donation.count({ where: { ...baseWhere, status: 'REJECTED' } }),
            prisma_js_1.prisma.donation.count({ where: { ...baseWhere, status: 'PENDING' } }),
            prisma_js_1.prisma.donation.aggregate({
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
    }
    catch (err) {
        next(err);
    }
});
router.get('/notificacoes/aluno/:alunoId', authMiddleware_js_1.authMiddleware, ownerOrAdmin('alunoId'), (req, res) => {
    const notifs = NotificationService_js_1.NotificationService.getUserNotifications(String(req.params.alunoId));
    res.json(notifs);
});
router.get('/notificacoes', authMiddleware_js_1.authMiddleware, (req, res) => {
    const userId = req.user.userId;
    const notifs = NotificationService_js_1.NotificationService.getUserNotifications(String(userId));
    res.json(notifs);
});
router.patch('/notificacoes/:id/read', authMiddleware_js_1.authMiddleware, (req, res) => {
    const success = NotificationService_js_1.NotificationService.markAsRead(String(req.params.id), req.user.userId);
    res.json({ success });
});
router.delete('/notificacoes/:id', authMiddleware_js_1.authMiddleware, (req, res) => {
    NotificationService_js_1.NotificationService.deleteNotification(String(req.params.id), req.user.userId);
    res.status(204).send();
});
function mapUser(u) {
    const isCoper = u.role === index_js_1.UserRole.COPER;
    const isAluno = u.role === index_js_1.UserRole.ALUNO;
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
router.get('/users', ...admin, async (req, res, next) => {
    try {
        const role = req.query.role;
        const where = role ? { role } : {};
        const users = await prisma_js_1.prisma.user.findMany({ where, orderBy: { name: 'asc' } });
        res.json(users.map(mapUser));
    }
    catch (err) {
        next(err);
    }
});
router.get('/usuarios', ...admin, async (req, res, next) => {
    try {
        const users = await prisma_js_1.prisma.user.findMany({ orderBy: { name: 'asc' } });
        res.json(users.map(mapUser));
    }
    catch (err) {
        next(err);
    }
});
router.get('/usuarios/alunos', ...admin, async (req, res, next) => {
    try {
        const alunos = await prisma_js_1.prisma.user.findMany({
            where: { role: index_js_1.UserRole.ALUNO },
            orderBy: { name: 'asc' },
        });
        res.json(alunos.map(mapUser));
    }
    catch (err) {
        next(err);
    }
});
router.get('/usuarios/:id', authMiddleware_js_1.authMiddleware, ownerOrAdmin('id'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id } });
        if (!user)
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        res.json(mapUser(user));
    }
    catch (err) {
        next(err);
    }
});
router.put('/usuarios/:id', authMiddleware_js_1.authMiddleware, ownerOrAdmin('id'), async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { nome, novaSenha } = zod_1.z.object({
            nome: zod_1.z.string().trim().min(3),
            novaSenha: zod_1.z.string().min(6).optional(),
        }).parse(req.body);
        const user = await prisma_js_1.prisma.user.update({
            where: { id },
            data: { name: nome, ...(novaSenha && { passwordHash: await PasswordHasher_js_1.PasswordHasher.hash(novaSenha) }) },
        });
        res.json(mapUser(user));
    }
    catch (err) {
        next(err);
    }
});
router.post('/doacoes', authMiddleware_js_1.authMiddleware, upload.single('foto'), async (req, res, next) => {
    let evidenceFile;
    try {
        const alunoId = req.body.alunoId ? String(req.body.alunoId) : undefined;
        const matricula = req.body.matricula ? String(req.body.matricula) : '';
        const tipoItem = req.body.tipoItem ? String(req.body.tipoItem) : 'Doação Solidária';
        const quantidade = zod_1.z.coerce.number().finite().positive().parse(req.body.quantidade);
        const campanhaId = req.body.campanhaId || req.body.campaignId;
        if (campanhaId) {
            const campaign = await prisma_js_1.prisma.campaign.findUnique({ where: { id: String(campanhaId) } });
            if (!campaign)
                throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
            if ((0, campaignRoutes_js_1.computeCampaignStatus)(campaign.startDate, campaign.endDate, campaign.status) !== index_js_1.CampaignStatus.ACTIVE) {
                throw AppError_js_1.AppError.badRequest('Esta campanha está fora do período de arrecadação.');
            }
        }
        const actor = req.user;
        let targetUserId = actor.userId;
        if (alunoId || matricula) {
            const student = await prisma_js_1.prisma.user.findFirst({
                where: { id: alunoId, matricula: matricula || undefined, role: index_js_1.UserRole.ALUNO },
                select: { id: true },
            });
            if (!student)
                throw AppError_js_1.AppError.notFound('Aluno não encontrado.');
            if (actor.role !== index_js_1.UserRole.COPER && actor.userId !== student.id) {
                throw AppError_js_1.AppError.forbidden('Apenas a COPER pode registrar doações em nome de outra pessoa.');
            }
            targetUserId = student.id;
        }
        const id = (0, node_crypto_1.randomUUID)();
        let evidenceUrl = null;
        if (req.file) {
            const bytes = req.file.buffer;
            const extension = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? 'jpg'
                : bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) ? 'png'
                    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
            if (!extension)
                throw AppError_js_1.AppError.badRequest('Selecione uma imagem JPEG, PNG ou WebP.');
            evidenceUrl = `/api/donations/${id}/evidence.${extension}`;
            const folder = (0, node_path_1.resolve)('uploads', 'evidencias');
            await (0, promises_1.mkdir)(folder, { recursive: true });
            const path = (0, node_path_1.resolve)(folder, `${id}.${extension}`);
            await (0, promises_1.writeFile)(path, bytes, { flag: 'wx' });
            evidenceFile = path;
        }
        const donation = await prisma_js_1.prisma.donation.create({
            data: {
                id,
                evidenceUrl,
                userId: targetUserId,
                status: index_js_1.DonationStatus.PENDING,
                campaignId: campanhaId || null,
                receivedById: actor.role === index_js_1.UserRole.COPER ? actor.userId : null,
                observation: req.body.localEntrega || null,
                hoursEarned: 0,
                items: {
                    create: [
                        {
                            description: tipoItem || 'Doação Solidária',
                            category: 'ALIMENTOS',
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
    }
    catch (err) {
        if (evidenceFile)
            await (0, promises_1.unlink)(evidenceFile).catch(() => { });
        next(err);
    }
});
router.put('/doacoes/:id', ...admin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const form = zod_1.z.object({
            tipoItem: zod_1.z.string().trim().min(2), quantidade: zod_1.z.coerce.number().finite().positive(),
            matricula: zod_1.z.string().trim().optional(), itemId: zod_1.z.string().optional(),
        }).parse(req.body);
        await prisma_js_1.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT id FROM donations WHERE id = ${id} FOR UPDATE`;
            const donation = await tx.donation.findUniqueOrThrow({ where: { id }, include: { items: true } });
            if (donation.status !== index_js_1.DonationStatus.PENDING)
                throw AppError_js_1.AppError.conflict('Somente doações pendentes podem ser editadas.');
            const item = form.itemId ? donation.items.find(i => i.id === form.itemId) : donation.items[0];
            if (!item)
                throw AppError_js_1.AppError.notFound('Item não encontrado nesta doação.');
            if (form.matricula) {
                const student = await tx.user.findUnique({ where: { matricula: form.matricula } });
                if (!student || student.role !== index_js_1.UserRole.ALUNO)
                    throw AppError_js_1.AppError.notFound('Matrícula não encontrada.');
                if (student.id !== donation.userId) {
                    await tx.donation.update({ where: { id }, data: { userId: student.id, donorName: null, donorCpf: null } });
                }
            }
            await tx.donationItem.update({ where: { id: item.id }, data: { description: form.tipoItem, quantity: form.quantidade } });
        });
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/doacoes/:id', ...admin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const removed = await prisma_js_1.prisma.donation.delete({
            where: { id, status: index_js_1.DonationStatus.PENDING }, select: { evidenceUrl: true },
        });
        const ext = removed.evidenceUrl?.match(/\/evidence\.(jpg|png|webp)$/)?.[1];
        if (ext && removed.evidenceUrl === `/api/donations/${id}/evidence.${ext}`) {
            await (0, promises_1.unlink)((0, node_path_1.resolve)('uploads', 'evidencias', `${id}.${ext}`)).catch(err => {
                if (err.code !== 'ENOENT')
                    console.error('Falha ao remover evidência da doação', id);
            });
        }
        res.sendStatus(204);
    }
    catch (err) {
        next(err);
    }
});
router.get('/doacoes', authMiddleware_js_1.authMiddleware, async (req, res, next) => {
    try {
        const actor = req.user;
        const donations = await prisma_js_1.prisma.donation.findMany({
            where: actor.role === index_js_1.UserRole.COPER ? {} : { userId: actor.userId },
            include: {
                items: true,
                user: { select: { name: true, matricula: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(donations.map((d) => ({
            id: d.id,
            data: d.createdAt.toLocaleDateString('pt-BR'),
            aluno: d.user.name,
            matricula: d.user.matricula,
            item: d.items[0]?.description || 'Doação Diversa',
            quantidade: d.items[0]?.quantity || 1,
            horas: d.hoursEarned,
            status: d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente',
        })));
    }
    catch (err) {
        next(err);
    }
});
router.get('/doacoes/aluno/:alunoId', authMiddleware_js_1.authMiddleware, ownerOrAdmin('alunoId'), async (req, res, next) => {
    try {
        const alunoId = String(req.params.alunoId);
        const donations = await prisma_js_1.prisma.donation.findMany({
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
        res.json(donations.map((d) => ({
            id: d.id,
            data: d.createdAt.toLocaleDateString('pt-BR'),
            aluno: d.user.name,
            matricula: d.user.matricula,
            item: d.items[0]?.description || 'Doação Diversa',
            quantidade: d.items[0]?.quantity || 1,
            horas: d.hoursEarned,
            status: d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente',
        })));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
