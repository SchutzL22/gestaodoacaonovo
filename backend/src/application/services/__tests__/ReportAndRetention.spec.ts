import { describe, it, expect } from 'vitest';
import { parsePeriod, validatePeriod } from '../../../presentation/routes/reportRoutes.js';
import { reportFilterSchema } from '../../dtos/donation.dto.js';

describe('Módulo de Relatórios e Retenção LGPD (Sistema COPER 3.0)', () => {
  describe('Validação de Período e Travas Temporais (RN10 / RN14 / RN15)', () => {
    it('deve aceitar período válido recente (ex: últimos 90 dias)', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 dias atrás
      const end = now;

      expect(() => validatePeriod(start, end)).not.toThrow();
    });

    it('deve rejeitar consulta com intervalo superior a 1 ano (RN10 / RN15)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 400 * 24 * 60 * 60 * 1000); // 400 dias

      expect(() => validatePeriod(start, end)).toThrow(
        /RN10.*intervalo máximo permitido.*1 ano/i
      );
    });

    it('deve rejeitar período com data anterior a 2 anos (política de retenção LGPD)', () => {
      const now = new Date();
      const oldStart = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000); // 3 anos atrás
      const oldEnd = new Date(oldStart.getTime() + 30 * 24 * 60 * 60 * 1000);

      expect(() => validatePeriod(oldStart, oldEnd)).toThrow(
        /política de retenção.*restrito aos últimos 2 anos/i
      );
    });

    it('deve bloquear emissões de doações com mais de 1 ano do registro (RN10)', () => {
      const now = new Date();
      const pastStart = new Date(now.getTime() - 450 * 24 * 60 * 60 * 1000); // ~15 meses atrás
      const pastEnd = new Date(pastStart.getTime() + 60 * 24 * 60 * 60 * 1000); // intervalo 60 dias

      expect(() => validatePeriod(pastStart, pastEnd)).toThrow(
        /RN10.*mais de 1 ano/i
      );
    });
  });

  describe('Validação de Parâmetros de Filtro (reportFilterSchema com campaignId)', () => {
    it('deve aceitar filtro completo com campaignId, datas e status', () => {
      const input = {
        campaignId: 'c0a80123-0000-0000-0000-000000000101',
        startDate: '2026-04-01',
        endDate: '2026-11-01',
        status: 'APPROVED',
        page: 1,
        limit: 20,
      };

      const result = reportFilterSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campaignId).toBe('c0a80123-0000-0000-0000-000000000101');
        expect(result.data.status).toBe('APPROVED');
      }
    });

    it('deve usar defaults para status, page e limit quando omitidos', () => {
      const input = {
        startDate: '2026-06-01',
      };

      const result = reportFilterSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('ALL');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });
  });

  describe('Formatação de CSV Compatível com Excel', () => {
    it('deve conter BOM UTF-8 e separador de ponto e vírgula', () => {
      const BOM = '\uFEFF';
      const header = 'ID;Doador;Email;Matricula;Tipo Doador;CPF;Campanha;Itens;Quantidade Total;Status;Horas Concedidas;Data Registro;Validado Por;Observacao';
      const row = '1;Lucas Schutz;lucas.schutz@aluno.fmpsc.edu.br;20241001;ALUNO;***.***.***-**;Agasalho 2026;5x Cobertores;5;Aprovada;10;20/11/2026;COPER Admin;Doação homologada';

      const csv = BOM + header + '\n' + row;

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv.includes(';')).toBe(true);
      const cols = header.split(';');
      expect(cols.length).toBe(14);
      expect(cols[0]).toBe('ID');
      expect(cols[1]).toBe('Doador');
    });
  });
});
