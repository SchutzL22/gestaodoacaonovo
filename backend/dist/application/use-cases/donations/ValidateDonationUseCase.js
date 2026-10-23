"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateDonationUseCase = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
class ValidateDonationUseCase {
    async execute(donationId, validatorId, data) {
        const donation = await prisma_js_1.prisma.donation.findUnique({
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
        const computedHours = data.status === index_js_1.DonationStatus.APPROVED && isStudent ? data.hoursEarned : 0;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            const updatedDonation = await tx.donation.update({
                where: { id: donationId },
                data: {
                    status: data.status,
                    validatedByUserId: validatorId,
                    hoursEarned: computedHours,
                    rejectionReason: data.status === index_js_1.DonationStatus.REJECTED ? data.rejectionReason : null,
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
exports.ValidateDonationUseCase = ValidateDonationUseCase;
