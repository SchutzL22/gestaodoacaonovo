import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { PublicValidationController } from '../controllers/PublicValidationController.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { DonationStatus, CampaignStatus } from '../../domain/enums/index.js';
import { computeCampaignStatus } from './campaignRoutes.js';

const router = Router();
const publicController = new PublicValidationController();

// Rate limiting específico contra força bruta na validação de hashes (60 req / 15 min por IP)
const publicValidationLimiter = rateLimit({
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

// Validação pública de autenticidade de documentos (sem autenticação)
router.get('/validar', publicValidationLimiter, publicController.validateDocument);
router.get('/validar/:code', publicValidationLimiter, publicController.validateDocument);

// Estatísticas de impacto social público
router.get('/stats', publicController.publicStats);

const anonymousDonationSchema = z.object({
  donorName: z.string().min(3, 'Nome do doador é obrigatório (mínimo 3 caracteres)'),
  donorCpf: z
    .string()
    .min(11, 'CPF deve conter no mínimo 11 dígitos')
    .max(14)
    .transform((val) => val.replace(/\D/g, '')),
  donorEmail: z.string().email('E-mail inválido').optional().nullable(),
  donorPhone: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  evidenceUrl: z.string().url('URL de evidência inválida').optional().nullable(),
  observation: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        description: z.string().min(2, 'Descrição do item é obrigatória'),
        category: z.string().min(2, 'Categoria é obrigatória'),
        quantity: z.number().positive('Quantidade deve ser maior que zero'),
        unit: z.string().optional().default('unidades'),
      })
    )
    .min(1, 'A doação deve conter pelo menos 1 item'),
});

// Registro de doação sem login (CIVIL anônimo / comunidade externa)
router.post(
  '/doacoes/anonima',
  validate({ body: anonymousDonationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        donorName,
        donorCpf,
        donorEmail,
        donorPhone,
        campaignId,
        evidenceUrl,
        observation,
        items,
      } = req.body;

      // Localiza usuário existente pelo CPF ou busca o usuário padrão da comunidade CIVIL
      let donorUser = await prisma.user.findUnique({
        where: { cpf: donorCpf },
      });

      if (!donorUser) {
        donorUser =
          (await prisma.user.findFirst({ where: { role: 'CIVIL' } })) ||
          (await prisma.user.findFirst({ where: { role: 'COPER' } }));
      }

      if (!donorUser) {
        return res.status(500).json({
          status: 'error',
          message: 'Sistema temporariamente indisponível para registro anônimo.',
        });
      }

      let validCampaignId: string | null = null;
      if (campaignId) {
        const camp = await prisma.campaign.findUnique({ where: { id: campaignId } }).catch(() => null);
        if (camp) {
          // Trava de negócio: impede doações em campanhas FUTURAS ou ENCERRADAS
          const campStatus = computeCampaignStatus(camp.startDate, camp.endDate);
          if (campStatus !== CampaignStatus.ACTIVE) {
            return res.status(400).json({
              status: 'error',
              message: `Esta campanha não está ativa para receber doações (status: ${campStatus}).`,
            });
          }
          validCampaignId = campaignId;
        }
      }

      const authHash = uuidv4();

      const donation = await prisma.donation.create({
        data: {
          userId: donorUser.id,
          status: DonationStatus.PENDING,
          authHash,
          donorName,
          donorCpf,
          campaignId: validCampaignId,
          evidenceUrl: evidenceUrl || null,
          observation: observation || (donorPhone ? `Telefone informado: ${donorPhone}` : null),
          items: {
            create: items.map((item: any) => ({
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
    } catch (err) {
      next(err);
    }
  }
);

export default router;
