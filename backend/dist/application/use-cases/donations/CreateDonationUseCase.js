"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDonationUseCase = void 0;
const campaignStatus_js_1 = require("../../../domain/campaignStatus.js");
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const index_js_1 = require("../../../domain/enums/index.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class CreateDonationUseCase {
    async execute(userId, data) {
        if (data.campaignId) {
            const campaign = await prisma_js_1.prisma.campaign.findUnique({
                where: { id: data.campaignId },
            });
            if (!campaign) {
                throw AppError_js_1.AppError.notFound('Campanha não encontrada.');
            }
            if ((0, campaignStatus_js_1.computeCampaignStatus)(campaign.startDate, campaign.endDate, campaign.status) !== index_js_1.CampaignStatus.ACTIVE) {
                throw AppError_js_1.AppError.badRequest('Não é possível registrar doações para campanhas com status FUTURA ou ENCERRADA.');
            }
        }
        const authHash = (0, uuid_1.v4)();
        const donation = await prisma_js_1.prisma.donation.create({
            data: {
                userId,
                status: index_js_1.DonationStatus.PENDING,
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
exports.CreateDonationUseCase = CreateDonationUseCase;
