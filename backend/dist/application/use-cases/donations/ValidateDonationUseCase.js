"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateDonationUseCase = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
const MailService_js_1 = require("../../../infrastructure/mail/MailService.js");
const NotificationService_js_1 = require("../../services/NotificationService.js");
class ValidateDonationUseCase {
    async execute(donationId, validatorId, data) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT u.id FROM users u JOIN donations d ON d.user_id = u.id
        WHERE d.id = ${donationId} FOR UPDATE OF u, d`;
            const donation = await tx.donation.findUnique({
                where: { id: donationId },
                include: {
                    user: true,
                    items: true,
                },
            });
            if (!donation) {
                throw AppError_js_1.AppError.notFound('Doação não encontrada.');
            }
            if (donation.status !== index_js_1.DonationStatus.PENDING) {
                throw AppError_js_1.AppError.badRequest('Esta doação já foi avaliada anteriormente.');
            }
            const isStudent = donation.user.role === index_js_1.UserRole.ALUNO;
            if (data.status === index_js_1.DonationStatus.APPROVED && isStudent && !donation.user.isActive) {
                throw AppError_js_1.AppError.badRequest('Trava de validação: Não é permitido aprovar horas para aluno com matrícula inativa no sistema.');
            }
            let computedHours = 0;
            if (data.status === index_js_1.DonationStatus.APPROVED && isStudent) {
                computedHours = data.hoursEarned || 0;
                if (donation.user.semesterHoursLimit && donation.user.semesterHoursLimit > 0) {
                    const remainingHours = Math.max(0, donation.user.semesterHoursLimit - donation.user.totalHoursEarned);
                    if (computedHours > remainingHours) {
                        computedHours = remainingHours;
                    }
                }
            }
            const updatedDonation = await tx.donation.update({
                where: { id: donationId },
                data: {
                    status: data.status,
                    validatedByUserId: validatorId,
                    hoursEarned: computedHours,
                    rejectionReason: data.status === index_js_1.DonationStatus.REJECTED ? data.rejectionReason : null,
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
            if (data.status === index_js_1.DonationStatus.APPROVED && isStudent && computedHours > 0) {
                await tx.user.update({
                    where: { id: donation.userId },
                    data: {
                        totalHoursEarned: {
                            increment: computedHours,
                        },
                    },
                });
            }
            let certificate = null;
            if (data.status === index_js_1.DonationStatus.APPROVED) {
                const certHash = (0, uuid_1.v4)();
                const validationUrl = `${frontendUrl}/validar?code=${certHash}`;
                certificate = await tx.certificate.create({
                    data: {
                        userId: donation.userId,
                        donationId: donation.id,
                        type: index_js_1.DocType.DONATION_DECLARATION,
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
        const { donation } = result;
        const computedHours = donation.hoursEarned;
        const isStudent = donation.user.role === index_js_1.UserRole.ALUNO;
        if (donation.user.email === 'doacoes-sem-login@coper.invalid')
            return result;
        try {
            const isApproved = data.status === index_js_1.DonationStatus.APPROVED;
            const effectiveHash = result.certificate?.authHash || result.donation.authHash;
            NotificationService_js_1.NotificationService.createNotification({
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
            if (donation.user.email) {
                MailService_js_1.MailService.sendDonationStatusNotification({
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
        }
        catch (notifErr) {
            console.error('[ValidateDonationUseCase] Erro ao gerar notificação:', notifErr);
        }
        return result;
    }
}
exports.ValidateDonationUseCase = ValidateDonationUseCase;
