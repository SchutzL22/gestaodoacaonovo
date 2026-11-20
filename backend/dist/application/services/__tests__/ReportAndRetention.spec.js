"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const reportRoutes_js_1 = require("../../../presentation/routes/reportRoutes.js");
const donation_dto_js_1 = require("../../dtos/donation.dto.js");
(0, vitest_1.describe)('Módulo de Relatórios e Retenção LGPD (Sistema COPER 3.0)', () => {
    (0, vitest_1.describe)('Validação de Período e Travas Temporais (RN10 / RN14 / RN15)', () => {
        (0, vitest_1.it)('deve aceitar período válido recente (ex: últimos 90 dias)', () => {
            const now = new Date();
            const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
            const end = now;
            (0, vitest_1.expect)(() => (0, reportRoutes_js_1.validatePeriod)(start, end)).not.toThrow();
        });
        (0, vitest_1.it)('deve rejeitar consulta com intervalo superior a 1 ano (RN10 / RN15)', () => {
            const end = new Date();
            const start = new Date(end.getTime() - 400 * 24 * 60 * 60 * 1000);
            (0, vitest_1.expect)(() => (0, reportRoutes_js_1.validatePeriod)(start, end)).toThrow(/RN10.*intervalo máximo permitido.*1 ano/i);
        });
        (0, vitest_1.it)('deve rejeitar período com data anterior a 2 anos (política de retenção LGPD)', () => {
            const now = new Date();
            const oldStart = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
            const oldEnd = new Date(oldStart.getTime() + 30 * 24 * 60 * 60 * 1000);
            (0, vitest_1.expect)(() => (0, reportRoutes_js_1.validatePeriod)(oldStart, oldEnd)).toThrow(/política de retenção.*restrito aos últimos 2 anos/i);
        });
        (0, vitest_1.it)('deve bloquear emissões de doações com mais de 1 ano do registro (RN10)', () => {
            const now = new Date();
            const pastStart = new Date(now.getTime() - 450 * 24 * 60 * 60 * 1000);
            const pastEnd = new Date(pastStart.getTime() + 60 * 24 * 60 * 60 * 1000);
            (0, vitest_1.expect)(() => (0, reportRoutes_js_1.validatePeriod)(pastStart, pastEnd)).toThrow(/RN10.*mais de 1 ano/i);
        });
    });
    (0, vitest_1.describe)('Validação de Parâmetros de Filtro (reportFilterSchema com campaignId)', () => {
        (0, vitest_1.it)('deve aceitar filtro completo com campaignId, datas e status', () => {
            const input = {
                campaignId: 'c0a80123-0000-0000-0000-000000000101',
                startDate: '2026-04-01',
                endDate: '2026-11-01',
                status: 'APPROVED',
                page: 1,
                limit: 20,
            };
            const result = donation_dto_js_1.reportFilterSchema.safeParse(input);
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.campaignId).toBe('c0a80123-0000-0000-0000-000000000101');
                (0, vitest_1.expect)(result.data.status).toBe('APPROVED');
            }
        });
        (0, vitest_1.it)('deve usar defaults para status, page e limit quando omitidos', () => {
            const input = {
                startDate: '2026-06-01',
            };
            const result = donation_dto_js_1.reportFilterSchema.safeParse(input);
            (0, vitest_1.expect)(result.success).toBe(true);
            if (result.success) {
                (0, vitest_1.expect)(result.data.status).toBe('ALL');
                (0, vitest_1.expect)(result.data.page).toBe(1);
                (0, vitest_1.expect)(result.data.limit).toBe(20);
            }
        });
    });
    (0, vitest_1.describe)('Formatação de CSV Compatível com Excel', () => {
        (0, vitest_1.it)('deve conter BOM UTF-8 e separador de ponto e vírgula', () => {
            const BOM = '\uFEFF';
            const header = 'ID;Doador;Email;Matricula;Tipo Doador;CPF;Campanha;Itens;Quantidade Total;Status;Horas Concedidas;Data Registro;Validado Por;Observacao';
            const row = '1;Lucas Schutz;lucas.schutz@aluno.fmpsc.edu.br;20241001;ALUNO;***.***.***-**;Agasalho 2026;5x Cobertores;5;Aprovada;10;20/11/2026;COPER Admin;Doação homologada';
            const csv = BOM + header + '\n' + row;
            (0, vitest_1.expect)(csv.startsWith('\uFEFF')).toBe(true);
            (0, vitest_1.expect)(csv.includes(';')).toBe(true);
            const cols = header.split(';');
            (0, vitest_1.expect)(cols.length).toBe(14);
            (0, vitest_1.expect)(cols[0]).toBe('ID');
            (0, vitest_1.expect)(cols[1]).toBe('Doador');
        });
    });
});
