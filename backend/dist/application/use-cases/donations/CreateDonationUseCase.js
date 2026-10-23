"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDonationUseCase = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const index_js_1 = require("../../../domain/enums/index.js");
class CreateDonationUseCase {
    async execute(userId, data) {
        const authHash = (0, uuid_1.v4)();
        const donation = await prisma_js_1.prisma.donation.create({
            data: {
                userId,
                status: index_js_1.DonationStatus.PENDING,
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
exports.CreateDonationUseCase = CreateDonationUseCase;
