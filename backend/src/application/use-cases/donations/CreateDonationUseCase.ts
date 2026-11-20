import { computeCampaignStatus } from '../../../domain/campaignStatus.js';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { CreateDonationInput } from '../../dtos/donation.dto.js';
import { DonationStatus, CampaignStatus } from '../../../domain/enums/index.js';
import { AppError } from '../../../domain/errors/AppError.js';

export class CreateDonationUseCase {
  async execute(userId: string, data: CreateDonationInput) {
    if (data.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: data.campaignId },
      });
      if (!campaign) {
        throw AppError.notFound('Campanha não encontrada.');
      }

      if (computeCampaignStatus(campaign.startDate, campaign.endDate, campaign.status) !== CampaignStatus.ACTIVE) {
        throw AppError.badRequest('Não é possível registrar doações para campanhas com status FUTURA ou ENCERRADA.');
      }
    }

    const authHash = uuidv4();

    const donation = await prisma.donation.create({
      data: {
        userId,
        status: DonationStatus.PENDING,
        authHash,
        evidenceUrl: data.evidenceUrl || null,
        campaignId: data.campaignId || null,
        receivedById: data.receivedById || null,
        donorName: data.donorName || null,
        donorCpf: data.donorCpf || null,
        observation: data.observation || null,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit || 'unidades',
          })),
        },
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            matricula: true,
            isActive: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return donation;
  }
}
