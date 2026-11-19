"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const PublicValidationController_js_1 = require("../controllers/PublicValidationController.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const validationMiddleware_js_1 = require("../middlewares/validationMiddleware.js");
const index_js_1 = require("../../domain/enums/index.js");
const router = (0, express_1.Router)();
const publicController = new PublicValidationController_js_1.PublicValidationController();
const publicValidationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        statusCode: 429,
        message: 'Muitas consultas de autenticidade realizadas a partir deste endereço IP. Aguarde alguns instantes.',
    },
});
router.get('/validar', publicValidationLimiter, publicController.validateDocument);
router.get('/validar/:code', publicValidationLimiter, publicController.validateDocument);
router.get('/stats', publicController.publicStats);
const anonymousDonationSchema = zod_1.z.object({
    donorName: zod_1.z.string().min(3, 'Nome do doador é obrigatório (mínimo 3 caracteres)'),
    donorCpf: zod_1.z
        .string()
        .min(11, 'CPF deve conter no mínimo 11 dígitos')
        .max(14)
        .transform((val) => val.replace(/\D/g, '')),
    donorEmail: zod_1.z.string().email('E-mail inválido').optional().nullable(),
    donorPhone: zod_1.z.string().optional().nullable(),
    campaignId: zod_1.z.string().uuid('ID de campanha inválido').optional().nullable(),
    evidenceUrl: zod_1.z.string().url('URL de evidência inválida').optional().nullable(),
    observation: zod_1.z.string().optional().nullable(),
    items: zod_1.z
        .array(zod_1.z.object({
        description: zod_1.z.string().min(2, 'Descrição do item é obrigatória'),
        category: zod_1.z.string().min(2, 'Categoria é obrigatória'),
        quantity: zod_1.z.number().positive('Quantidade deve ser maior que zero'),
        unit: zod_1.z.string().optional().default('unidades'),
    }))
        .min(1, 'A doação deve conter pelo menos 1 item'),
});
router.post('/doacoes/anonima', (0, validationMiddleware_js_1.validate)({ body: anonymousDonationSchema }), async (req, res, next) => {
    try {
        const { donorName, donorCpf, donorEmail, donorPhone, campaignId, evidenceUrl, observation, items, } = req.body;
        let donorUser = await prisma_js_1.prisma.user.findUnique({
            where: { cpf: donorCpf },
        });
        if (!donorUser) {
            donorUser =
                (await prisma_js_1.prisma.user.findFirst({ where: { role: 'CIVIL' } })) ||
                    (await prisma_js_1.prisma.user.findFirst({ where: { role: 'COPER' } }));
        }
        if (!donorUser) {
            return res.status(500).json({
                status: 'error',
                message: 'Sistema temporariamente indisponível para registro anônimo.',
            });
        }
        const authHash = (0, uuid_1.v4)();
        const donation = await prisma_js_1.prisma.donation.create({
            data: {
                userId: donorUser.id,
                status: index_js_1.DonationStatus.PENDING,
                authHash,
                donorName,
                donorCpf,
                campaignId: campaignId || null,
                evidenceUrl: evidenceUrl || null,
                observation: observation || (donorPhone ? `Telefone informado: ${donorPhone}` : null),
                items: {
                    create: items.map((item) => ({
                        description: item.description,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit || 'unidades',
                    })),
                },
            },
            include: {
                items: true,
                campaign: {
                    select: { id: true, title: true },
                },
            },
        });
        res.status(201).json({
            status: 'success',
            message: 'Doação registrada com sucesso! Aguardando conferência e validação pela equipe COPER.',
            data: {
                donationId: donation.id,
                authHash: donation.authHash,
                donorName: donation.donorName,
                donorCpf: donation.donorCpf,
                status: donation.status,
                itemsCount: donation.items.length,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
