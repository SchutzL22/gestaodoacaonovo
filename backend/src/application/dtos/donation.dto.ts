import { z } from 'zod';
import { DonationStatus } from '../../domain/enums/index.js';

export const donationItemSchema = z.object({
  description: z.string().min(2, 'Descrição do item é obrigatória'),
  category: z.string().min(2, 'Categoria é obrigatória (ex: ALIMENTOS, ROUPAS, HIGIENE, LIVROS)'),
  quantity: z.number().positive('A quantidade deve ser maior que zero'),
  unit: z.string().optional().default('unidades'),
});

export const createDonationSchema = z.object({
  items: z.array(donationItemSchema).min(1, 'A doação deve conter pelo menos 1 item'),
  evidenceUrl: z.string().url('URL da foto/evidência inválida').optional(),
  campaignId: z.string().uuid('ID de campanha inválido').optional().nullable(),
  receivedById: z.string().uuid('ID do recebedor inválido').optional().nullable(),
  donorName: z.string().min(3).optional().nullable(),
  donorCpf: z
    .string()
    .min(11)
    .max(14)
    .transform((val) => val.replace(/\D/g, ''))
    .optional()
    .nullable(),
  observation: z.string().optional().nullable(),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;

export const validateDonationSchema = z
  .object({
    status: z.enum([DonationStatus.APPROVED, DonationStatus.REJECTED]),
    hoursEarned: z.number().min(0, 'Horas atribuídas não podem ser negativas').default(0),
    rejectionReason: z.string().optional().nullable(),
    observation: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === DonationStatus.REJECTED) {
        return Boolean(data.rejectionReason && data.rejectionReason.trim().length > 0);
      }
      return true;
    },
    {
      message: 'O motivo da rejeição é obrigatório ao rejeitar uma doação.',
      path: ['rejectionReason'],
    }
  );

export type ValidateDonationInput = z.infer<typeof validateDonationSchema>;

// Filtro de relatório consolidado (com trava de até 1 ano e filtro por campanha)
export const reportFilterSchema = z.object({
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  endDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  status: z.enum(['ALL', DonationStatus.PENDING, DonationStatus.APPROVED, DonationStatus.REJECTED]).default('ALL'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
