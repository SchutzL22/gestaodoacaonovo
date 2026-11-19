"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredDonations = cleanupExpiredDonations;
const prisma_js_1 = require("../database/prisma.js");
async function cleanupExpiredDonations() {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
    const result = await prisma_js_1.prisma.donation.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });
    console.log(`[RetentionJob] Limpeza de retenção concluída. Registros de doações anteriores a ${cutoffDate.toISOString()} removidos: ${result.count}`);
    return {
        deletedCount: result.count,
        cutoffDate,
    };
}
