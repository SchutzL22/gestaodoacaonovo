import { prisma } from '../database/prisma.js';

/**
 * Regra de Retenção COPER 3.0:
 * Remove registros de doações com histórico superior a 2 anos (em vez de 5).
 */
export async function cleanupExpiredDonations(): Promise<{ deletedCount: number; cutoffDate: Date }> {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

  const result = await prisma.donation.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(
    `[RetentionJob] Limpeza de retenção concluída. Registros de doações anteriores a ${cutoffDate.toISOString()} removidos: ${result.count}`
  );

  return {
    deletedCount: result.count,
    cutoffDate,
  };
}
