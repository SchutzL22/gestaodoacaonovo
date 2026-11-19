import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { DonationStatus, UserRole, DocType } from '../../../domain/enums/index.js';
import { ValidateDonationInput } from '../../dtos/donation.dto.js';
import { MailService } from '../../../infrastructure/mail/MailService.js';
import { NotificationService } from '../../services/NotificationService.js';

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

    // Trava de segurança: impede aprovar horas para aluno com matrícula inativa
    if (data.status === DonationStatus.APPROVED && isStudent && !donation.user.isActive) {
      throw AppError.badRequest(
        'Trava de validação: Não é permitido aprovar horas para aluno com matrícula inativa no sistema.'
      );
    }

    // Apenas ALUNO acumula horas complementares; PROFESSOR, CIVIL, EMPRESARIO não acumulam
    let computedHours = 0;
    if (data.status === DonationStatus.APPROVED && isStudent) {
      computedHours = data.hoursEarned || 0;

      // Respeita limite semestral caso configurado
      if (donation.user.semesterHoursLimit && donation.user.semesterHoursLimit > 0) {
        const remainingHours = Math.max(0, donation.user.semesterHoursLimit - donation.user.totalHoursEarned);
        if (computedHours > remainingHours) {
          computedHours = remainingHours;
        }
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza status da doação e responsável pela validação
      const updatedDonation = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: data.status,
          validatedByUserId: validatorId,
          hoursEarned: computedHours,
          rejectionReason: data.status === DonationStatus.REJECTED ? data.rejectionReason : null,
          observation: data.observation || donation.observation,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              cpf: true,
              role: true,
              matricula: true,
              isActive: true,
              totalHoursEarned: true,
            },
          },
          items: true,
          validatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 2. Se for aluno aprovado com horas, atualiza o acumulado de horas do aluno
      if (data.status === DonationStatus.APPROVED && isStudent && computedHours > 0) {
        await tx.user.update({
          where: { id: donation.userId },
          data: {
            totalHoursEarned: {
              increment: computedHours,
            },
          },
        });
      }

      // 3. Se aprovada, emite a declaração de doação oficial com hash verificador
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
              donorName: donation.donorName || donation.user.name,
              donorRole: donation.user.role,
              observation: data.observation || null,
            },
          },
        });
      }

      return { donation: updatedDonation, certificate };
    });

    // 4. Disparo de Notificações Automáticas (E-mail + In-App Notification)
    try {
      const isApproved = data.status === DonationStatus.APPROVED;
      const effectiveHash = result.certificate?.authHash || result.donation.authHash;

      // In-App Notification
      NotificationService.createNotification({
        userId: donation.userId,
        title: isApproved ? 'Doação Homologada!' : 'Doação Não Homologada',
        message: isApproved
          ? isStudent && computedHours > 0
            ? `Sua doação foi aprovada e ${computedHours} horas complementares foram computadas no seu histórico!`
            : 'Sua doação solidária foi conferida e homologada com sucesso.'
          : `Sua solicitação de doação foi reprovada. Motivo: ${data.rejectionReason || 'Itens em desacordo.'}`,
        type: isApproved ? 'DONATION_APPROVED' : 'DONATION_REJECTED',
        link: isApproved ? `/validar?code=${effectiveHash}` : '/doar',
      });

      // E-mail Institucional via MailService
      if (donation.user.email) {
        MailService.sendDonationStatusNotification({
          userEmail: donation.user.email,
          userName: donation.user.name,
          status: isApproved ? 'APPROVED' : 'REJECTED',
          hoursEarned: computedHours,
          rejectionReason: data.rejectionReason || undefined,
          authHash: effectiveHash,
          isStudent,
        }).catch((err) => {
          console.error('[ValidateDonationUseCase] Erro ao enviar e-mail de status:', err);
        });
      }
    } catch (notifErr) {
      console.error('[ValidateDonationUseCase] Erro ao gerar notificação:', notifErr);
    }

    return result;
  }
}
