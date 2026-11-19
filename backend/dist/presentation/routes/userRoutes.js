"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const index_js_1 = require("../../domain/enums/index.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
router.get('/', (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (role)
            where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { cpf: { contains: String(search) } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma_js_1.prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    role: true,
                    matricula: true,
                    address: true,
                    phone: true,
                    isActive: true,
                    semesterHoursLimit: true,
                    totalHoursEarned: true,
                    createdAt: true,
                },
            }),
            prisma_js_1.prisma.user.count({ where }),
        ]);
        res.json({
            status: 'success',
            data: {
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/status', (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER), async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const user = await prisma_js_1.prisma.user.update({
            where: { id: String(req.params.id) },
            data: { isActive: Boolean(isActive) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                matricula: true,
            },
        });
        res.json({ status: 'success', data: { user } });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
