import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { CreateDonationInput } from '../../dtos/donation.dto.js';
import { DonationStatus } from '../../../domain/enums/index.js';

export class CreateDonationUseCase {
  async execute(userId: string, data: CreateDonationInput) {
    const authHash = uuidv4();

    const donation = await prisma.donation.create({
      data: {
        userId,
        status: DonationStatus.PENDING,
        authHash,
        evidenceUrl: data.evidenceUrl,
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
          },
        },
      },
    });

    return donation;
  }
}
