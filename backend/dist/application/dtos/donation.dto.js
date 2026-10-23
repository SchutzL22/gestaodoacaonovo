"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDonationSchema = exports.createDonationSchema = exports.donationItemSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../../domain/enums/index.js");
exports.donationItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(2, 'Descrição do item é obrigatória'),
    category: zod_1.z.string().min(2, 'Categoria é obrigatória (ex: ALIMENTOS, ROUPAS, HIGIENE)'),
    quantity: zod_1.z.number().positive('A quantidade deve ser maior que zero'),
    unit: zod_1.z.string().optional().default('unidades'),
});
exports.createDonationSchema = zod_1.z.object({
    items: zod_1.z.array(exports.donationItemSchema).min(1, 'A doação deve conter pelo menos 1 item'),
    evidenceUrl: zod_1.z.string().url('URL da foto/evidência inválida').optional(),
});
exports.validateDonationSchema = zod_1.z.object({
    status: zod_1.z.enum([index_js_1.DonationStatus.APPROVED, index_js_1.DonationStatus.REJECTED]),
    hoursEarned: zod_1.z.number().min(0, 'Horas atribuídas não podem ser negativas').default(0),
    rejectionReason: zod_1.z.string().optional(),
});
