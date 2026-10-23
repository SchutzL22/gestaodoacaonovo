import { z } from 'zod';
import { DonationStatus } from '../../domain/enums/index.js';

export const donationItemSchema = z.object({
  description: z.string().min(2, 'Descrição do item é obrigatória'),
  category: z.string().min(2, 'Categoria é obrigatória (ex: ALIMENTOS, ROUPAS, HIGIENE)'),
  quantity: z.number().positive('A quantidade deve ser maior que zero'),
  unit: z.string().optional().default('unidades'),
});

export const createDonationSchema = z.object({
  items: z.array(donationItemSchema).min(1, 'A doação deve conter pelo menos 1 item'),
  evidenceUrl: z.string().url('URL da foto/evidência inválida').optional(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

export const validateDonationSchema = z.object({
  status: z.enum([DonationStatus.APPROVED, DonationStatus.REJECTED]),
  hoursEarned: z.number().min(0, 'Horas atribuídas não podem ser negativas').default(0),
  rejectionReason: z.string().optional(),
});

export type ValidateDonationInput = z.infer<typeof validateDonationSchema>;
