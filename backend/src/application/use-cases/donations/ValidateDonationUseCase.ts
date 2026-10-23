import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { DonationStatus, UserRole, DocType } from '../../../domain/enums/index.js';
import { ValidateDonationInput } from '../../dtos/donation.dto.js';

export class ValidateDonationUseCase {
  async execute(donationId: string, validatorId: string, data: ValidateDonationInput) {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!donation) {
      throw AppError.notFound('Doação não encontrada.');
    }

    if (donation.status !== DonationStatus.PENDING) {
      throw AppError.badRequest('Esta doação já foi avaliada anteriormente.');
    }

    // Regra de Negócio: Conversão em horas apenas para perfil ALUNO
    const isStudent = donation.user.role === UserRole.ALUNO;
    const computedHours = data.status === DonationStatus.APPROVED && isStudent ? data.hoursEarned : 0;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza status da doação
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: data.status,
          validatedByUserId: validatorId,
          hoursEarned: computedHours,
          rejectionReason: data.status === DonationStatus.REJECTED ? data.rejectionReason : null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, cpf: true, role: true },
          },
          items: true,
          validatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 2. Se aprovada, emite a declaração de doação oficial com hash verificador
      let certificate = null;
      if (data.status === DonationStatus.APPROVED) {
        const certHash = uuidv4();
        const validationUrl = `${frontendUrl}/validar?code=${certHash}`;

        certificate = await tx.certificate.create({
          data: {
            userId: donation.userId,
            donationId: donation.id,
            type: DocType.DONATION_DECLARATION,
            authHash: certHash,
            validationUrl,
            title: 'Declaração de Doação e Ação Social',
            hours: computedHours,
            metadata: {
              itemsSummary: donation.items.map((i) => `${i.quantity} ${i.unit || ''} de ${i.description}`),
              validatorId,
              donorName: donation.user.name,
              donorRole: donation.user.role,
            },
          },
        });
      }

      return { donation: updatedDonation, certificate };
    });

    return result;
  }
}
