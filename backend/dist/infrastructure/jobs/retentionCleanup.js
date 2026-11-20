"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredDonations = cleanupExpiredDonations;
exports.scheduleRetentionJob = scheduleRetentionJob;
const prisma_js_1 = require("../database/prisma.js");
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function recordAuditLog(result, error) {
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
    console.log(line);
    try {
        const logsDir = path_1.default.join(process.cwd(), 'logs');
        if (!fs_1.default.existsSync(logsDir)) {
            fs_1.default.mkdirSync(logsDir, { recursive: true });
        }
        const logFilePath = path_1.default.join(logsDir, 'audit-retention.log');
        fs_1.default.appendFileSync(logFilePath, JSON.stringify(auditEntry) + '\n', 'utf8');
    }
    catch (fsErr) {
        console.error('[RetentionJob] Falha ao persistir arquivo de log de auditoria:', fsErr);
    }
}
async function cleanupExpiredDonations(triggeredBy = 'CRON_SCHEDULE') {
    const startTime = Date.now();
    const executedAt = new Date();
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
    console.log(`[RetentionJob] Iniciando rotina de retenção LGPD (2 anos). Corte: ${cutoffDate.toISOString()} | Disparo: ${triggeredBy}`);
    try {
        const expiredDonations = await prisma_js_1.prisma.donation.findMany({
            where: { createdAt: { lt: cutoffDate } },
            select: {
                id: true,
                donorName: true,
                donorCpf: true,
                certificate: { select: { id: true } },
            },
        });
        if (expiredDonations.length === 0) {
            const result = {
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
        const toAnonymize = expiredDonations.filter((d) => d.certificate !== null || !!d.donorName);
        const toDelete = expiredDonations.filter((d) => d.certificate === null && !d.donorName);
        let anonymizedCount = 0;
        let deletedCount = 0;
        if (toAnonymize.length > 0) {
            const anonymizeIds = toAnonymize.map((d) => d.id);
            await prisma_js_1.prisma.donation.updateMany({
                where: { id: { in: anonymizeIds } },
                data: {
                    donorName: 'DADOS REMOVIDOS (LGPD)',
                    donorCpf: '00000000000',
                    observation: '[Dados anonimizados automaticamente — política de retenção 2 anos / LGPD]',
                },
            });
            anonymizedCount = toAnonymize.length;
        }
        if (toDelete.length > 0) {
            const deleteIds = toDelete.map((d) => d.id);
            const deleteResult = await prisma_js_1.prisma.donation.deleteMany({
                where: { id: { in: deleteIds } },
            });
            deletedCount = deleteResult.count;
        }
        const result = {
            deletedCount,
            anonymizedCount,
            cutoffDate,
            executedAt,
            triggeredBy,
            executionTimeMs: Date.now() - startTime,
        };
        recordAuditLog(result);
        return result;
    }
    catch (err) {
        const failedResult = {
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
function scheduleRetentionJob() {
    node_cron_1.default.schedule('0 2 * * *', async () => {
        console.log('[RetentionJob] Disparo automático diário da rotina de retenção LGPD às 02:00.');
        try {
            const result = await cleanupExpiredDonations('CRON_DAILY_0200');
            console.log(`[RetentionJob] ✅ Sucesso — Anonimizadas: ${result.anonymizedCount} | ` +
                `Deletadas: ${result.deletedCount} | Duração: ${result.executionTimeMs}ms`);
        }
        catch (err) {
            console.error('[RetentionJob] ❌ Falha na rotina agendada de retenção:', err);
        }
    });
    console.log('[RetentionJob] Rotina de retenção LGPD agendada para 02:00 diariamente.');
}
