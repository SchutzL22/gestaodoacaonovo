import { prisma } from '../database/prisma.js';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Regra de Retenção COPER 3.0 — LGPD / RNF06 / RN09 / RN14
// Remove ou anonimiza doações com mais de 2 anos de criação.
// A anonimização preserva o registro para auditoria agregada de forma desidentificada.
// Todas as execuções são registradas no log de auditoria permanente do sistema.
// ─────────────────────────────────────────────────────────────────────────────

export interface RetentionResult {
  deletedCount: number;
  anonymizedCount: number;
  cutoffDate: Date;
  executedAt: Date;
  triggeredBy: string;
  executionTimeMs: number;
}

/**
 * Registra a execução no log de auditoria permanente do sistema.
 */
function recordAuditLog(result: RetentionResult, error?: any): void {
  const auditEntry = {
    timestamp: result.executedAt.toISOString(),
    event: 'DATA_RETENTION_CLEANUP_2_YEARS',
    triggeredBy: result.triggeredBy,
    cutoffDate: result.cutoffDate.toISOString(),
    anonymizedCount: result.anonymizedCount,
    deletedCount: result.deletedCount,
    executionTimeMs: result.executionTimeMs,
    status: error ? 'FAILED' : 'SUCCESS',
    error: error ? String(error?.message || error) : undefined,
  };

  const line = `[${auditEntry.timestamp}] [AUDIT_LOG] [RETENTION_JOB] ` +
    `Status=${auditEntry.status} TriggeredBy=${auditEntry.triggeredBy} ` +
    `CutoffDate=${auditEntry.cutoffDate} Anonymized=${auditEntry.anonymizedCount} ` +
    `Deleted=${auditEntry.deletedCount} Duration=${auditEntry.executionTimeMs}ms` +
    (error ? ` Error="${auditEntry.error}"` : '');

  // Log no console com tag de auditoria
  console.log(line);

  // Registro persistente em arquivo de auditoria
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'audit-retention.log');
    fs.appendFileSync(logFilePath, JSON.stringify(auditEntry) + '\n', 'utf8');
  } catch (fsErr) {
    console.error('[RetentionJob] Falha ao persistir arquivo de log de auditoria:', fsErr);
  }
}

/**
 * Executa a rotina de retenção de dados (2 anos).
 * - Doações com certificado emitido ou com identificação de terceiros são anonimizadas (LGPD).
 * - Doações sem certificado emitido e com mais de 2 anos são deletadas definitivamente.
 * - Grava entrada no log de auditoria do sistema.
 */
export async function cleanupExpiredDonations(triggeredBy: string = 'CRON_SCHEDULE'): Promise<RetentionResult> {
  const startTime = Date.now();
  const executedAt = new Date();
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);

  console.log(`[RetentionJob] Iniciando rotina de retenção LGPD (2 anos). Corte: ${cutoffDate.toISOString()} | Disparo: ${triggeredBy}`);

  try {
    // 1. Buscar doações expiradas (> 2 anos)
    const expiredDonations = await prisma.donation.findMany({
      where: { createdAt: { lt: cutoffDate } },
      select: {
        id: true,
        donorName: true,
        donorCpf: true,
        certificate: { select: { id: true } }, // relação 1:1 Certificate?
      },
    });

    if (expiredDonations.length === 0) {
      const result: RetentionResult = {
        deletedCount: 0,
        anonymizedCount: 0,
        cutoffDate,
        executedAt,
        triggeredBy,
        executionTimeMs: Date.now() - startTime,
      };
      recordAuditLog(result);
      return result;
    }

    // 2. Separar registros:
    //    - Anonimizar: doações com certificado emitido ou que possuem dados de terceiros (donorName)
    //    - Deletar: doações sem certificado e sem nome externo
    const toAnonymize = expiredDonations.filter(
      (d) => d.certificate !== null || !!d.donorName
    );
    const toDelete = expiredDonations.filter(
      (d) => d.certificate === null && !d.donorName
    );

    let anonymizedCount = 0;
    let deletedCount = 0;

    // 3. Anonimização LGPD — preserva agregação numérica mas elimina identificadores pessoais
    if (toAnonymize.length > 0) {
      const anonymizeIds = toAnonymize.map((d) => d.id);
      await prisma.donation.updateMany({
        where: { id: { in: anonymizeIds } },
        data: {
          donorName: 'DADOS REMOVIDOS (LGPD)',
          donorCpf: '00000000000',
          observation: '[Dados anonimizados automaticamente — política de retenção 2 anos / LGPD]',
        },
      });
      anonymizedCount = toAnonymize.length;
    }

    // 4. Deleção definitiva física (registros sem valor de fé pública emitida)
    if (toDelete.length > 0) {
      const deleteIds = toDelete.map((d) => d.id);
      const deleteResult = await prisma.donation.deleteMany({
        where: { id: { in: deleteIds } },
      });
      deletedCount = deleteResult.count;
    }

    const result: RetentionResult = {
      deletedCount,
      anonymizedCount,
      cutoffDate,
      executedAt,
      triggeredBy,
      executionTimeMs: Date.now() - startTime,
    };

    recordAuditLog(result);
    return result;
  } catch (err) {
    const failedResult: RetentionResult = {
      deletedCount: 0,
      anonymizedCount: 0,
      cutoffDate,
      executedAt,
      triggeredBy,
      executionTimeMs: Date.now() - startTime,
    };
    recordAuditLog(failedResult, err);
    throw err;
  }
}

/**
 * Agenda a rotina de retenção diariamente às 02:00 (horário do servidor).
 * Invocada durante o bootstrap da aplicação Express.
 */
export function scheduleRetentionJob(): void {
  // Executa diariamente às 02:00 da madrugada
  cron.schedule('0 2 * * *', async () => {
    console.log('[RetentionJob] Disparo automático diário da rotina de retenção LGPD às 02:00.');
    try {
      const result = await cleanupExpiredDonations('CRON_DAILY_0200');
      console.log(
        `[RetentionJob] ✅ Sucesso — Anonimizadas: ${result.anonymizedCount} | ` +
        `Deletadas: ${result.deletedCount} | Duração: ${result.executionTimeMs}ms`
      );
    } catch (err) {
      console.error('[RetentionJob] ❌ Falha na rotina agendada de retenção:', err);
    }
  });

  console.log('[RetentionJob] Rotina de retenção LGPD agendada para 02:00 diariamente.');
}
