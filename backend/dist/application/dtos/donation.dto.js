"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportFilterSchema = exports.validateDonationSchema = exports.createDonationSchema = exports.donationItemSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../../domain/enums/index.js");
exports.donationItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(2, 'Descrição do item é obrigatória'),
    category: zod_1.z.string().min(2, 'Categoria é obrigatória (ex: ALIMENTOS, ROUPAS, HIGIENE, LIVROS)'),
    quantity: zod_1.z.number().positive('A quantidade deve ser maior que zero'),
    unit: zod_1.z.string().optional().default('unidades'),
});
exports.createDonationSchema = zod_1.z.object({
    items: zod_1.z.array(exports.donationItemSchema).min(1, 'A doação deve conter pelo menos 1 item'),
    evidenceUrl: zod_1.z.string().url('URL da foto/evidência inválida').optional(),
    campaignId: zod_1.z.string().uuid('ID de campanha inválido').optional().nullable(),
    receivedById: zod_1.z.string().uuid('ID do recebedor inválido').optional().nullable(),
    donorName: zod_1.z.string().min(3).optional().nullable(),
    donorCpf: zod_1.z
        .string()
        .min(11)
        .max(14)
        .transform((val) => val.replace(/\D/g, ''))
        .optional()
        .nullable(),
    observation: zod_1.z.string().optional().nullable(),
});
exports.validateDonationSchema = zod_1.z
    .object({
    status: zod_1.z.enum([index_js_1.DonationStatus.APPROVED, index_js_1.DonationStatus.REJECTED]),
    hoursEarned: zod_1.z.number().min(0, 'Horas atribuídas não podem ser negativas').default(0),
    rejectionReason: zod_1.z.string().optional().nullable(),
    observation: zod_1.z.string().optional().nullable(),
})
    .refine((data) => {
    if (data.status === index_js_1.DonationStatus.REJECTED) {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0);
    }
    return true;
}, {
    message: 'O motivo da rejeição é obrigatório ao rejeitar uma doação.',
    path: ['rejectionReason'],
});
exports.reportFilterSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    endDate: zod_1.z.string().datetime().optional().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    status: zod_1.z.enum(['ALL', index_js_1.DonationStatus.PENDING, index_js_1.DonationStatus.APPROVED, index_js_1.DonationStatus.REJECTED]).default('ALL'),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
