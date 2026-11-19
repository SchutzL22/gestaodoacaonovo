"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
router.get('/', async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        if (!q || q.length < 2) {
            res.json({ status: 'success', data: { students: [], campaigns: [], donations: [] } });
            return;
        }
        const cleanCpf = q.replace(/\D/g, '');
        const [students, campaigns, donations] = await Promise.all([
            prisma_js_1.prisma.user.findMany({
                where: {
                    role: 'ALUNO',
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { matricula: { contains: q, mode: 'insensitive' } },
                        ...(cleanCpf.length >= 3 ? [{ cpf: { contains: cleanCpf } }] : []),
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    matricula: true,
                    email: true,
                    role: true,
                    totalHoursEarned: true,
                },
            }).catch(() => []),
            prisma_js_1.prisma.campaign.findMany({
                where: {
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } },
                    ],
                },
                take: 5,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    isUrgent: true,
                },
            }).catch(() => []),
            prisma_js_1.prisma.donation.findMany({
                where: {
                    OR: [
                        { donorName: { contains: q, mode: 'insensitive' } },
                        { authHash: { contains: q, mode: 'insensitive' } },
                        { user: { name: { contains: q, mode: 'insensitive' } } },
                        { items: { some: { description: { contains: q, mode: 'insensitive' } } } },
                    ],
                },
                take: 5,
                include: {
                    user: { select: { name: true, matricula: true } },
                    items: true,
                },
                orderBy: { createdAt: 'desc' },
            }).catch(() => []),
        ]);
        res.json({
            status: 'success',
            data: {
                students,
                campaigns,
                donations: donations.map((d) => ({
                    id: d.id,
                    authHash: d.authHash,
                    donorName: d.donorName || d.user.name,
                    matricula: d.user.matricula,
                    item: d.items[0]?.description || 'Doação Solidária',
                    status: d.status,
                    hoursEarned: d.hoursEarned,
                })),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
