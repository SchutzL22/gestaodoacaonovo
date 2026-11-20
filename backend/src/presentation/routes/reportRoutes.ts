import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { reportFilterSchema } from '../../application/dtos/donation.dto.js';
import { Role } from '../../domain/enums/index.js';
import { AppError } from '../../domain/errors/AppError.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de Período e Validação (RN10, RN14, RN15)
// ─────────────────────────────────────────────────────────────────────────────

export function parsePeriod(startDate: any, endDate: any): {
  parsedStart: Date;
  parsedEnd: Date;
} {
  const now = new Date();
  const parsedEnd = endDate ? new Date(endDate) : now;
  const parsedStart = startDate
    ? new Date(startDate)
    : new Date(parsedEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
  return { parsedStart, parsedEnd };
}

export function validatePeriod(parsedStart: Date, parsedEnd: Date): void {
  const now = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);

  // 1. Trava da Regra de Retenção de 2 anos (RF07 / RNF06 / RN14)
  if (parsedStart < twoYearsAgo) {
    throw AppError.badRequest(
      'Política de retenção: O histórico do sistema está restrito aos últimos 2 anos.'
    );
  }

  // 2. Trava da Regra de Negócio RN10 / RN15: Amplitude máxima de 1 ano
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  if (parsedEnd.getTime() - parsedStart.getTime() > ONE_YEAR_MS) {
    throw AppError.badRequest(
      'Regra de Negócio RN10: O intervalo máximo permitido para relatórios é de até 1 ano por consulta.'
    );
  }

  // 3. Trava da Regra de Negócio RN10: Bloqueio de registros com mais de 1 ano
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  if (parsedStart < oneYearAgo) {
    throw AppError.badRequest(
      'Regra de Negócio RN10: Não é permitida a emissão de relatórios operacionais referentes a doações com mais de 1 ano da data do registro.'
    );
  }
}

function getLogoBuffer(): Buffer | null {
  const candidatePaths = [
    path.join(process.cwd(), 'src/assets/fmplogo.png'),
    path.join(process.cwd(), 'backend/src/assets/fmplogo.png'),
    path.join(process.cwd(), '../client/src/assets/fmplogo.png'),
    path.join(process.cwd(), 'client/src/assets/fmplogo.png'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p);
      } catch {}
    }
  }
  return null;
}

async function fetchReportData(parsedStart: Date, parsedEnd: Date, status: string, campaignId?: string) {
  const where: any = {
    createdAt: { gte: parsedStart, lte: parsedEnd },
  };
  if (status && status !== 'ALL') where.status = status;
  if (campaignId) where.campaignId = campaignId;

  const [donations, total, hoursAgg, byStatus, itemsByCategory] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500, // limite operacional de segurança
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, role: true, matricula: true, cpf: true } },
        validatedBy: { select: { id: true, name: true } },
        campaign: { select: { id: true, title: true } },
      },
    }),
    prisma.donation.count({ where }),
    prisma.donation.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { hoursEarned: true },
    }),
    prisma.donation.groupBy({ by: ['status'], where, _count: true }),
    prisma.donationItem.groupBy({
      by: ['category'],
      where: { donation: where },
      _sum: { quantity: true },
      _count: true,
    }),
  ]);

  const statusSummary: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  byStatus.forEach((s) => { statusSummary[s.status] = s._count; });

  const totalItemsCount = itemsByCategory.reduce((acc, c) => acc + (c._sum.quantity || 0), 0);
  const alunosParticipantes = new Set(
    donations.filter((d) => d.user?.role === 'ALUNO').map((d) => d.userId)
  ).size;

  return {
    donations,
    total,
    statusSummary,
    totalHoursGranted: hoursAgg._sum?.hoursEarned || 0,
    totalItemsCount,
    alunosParticipantes,
    itemsByCategory,
    estimatedBeneficiaries: Math.round(totalItemsCount * 0.4),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /reports/consolidated — JSON consolidado para tela COPER / EMPRESARIO
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/consolidated',
  requireRoles(Role.COPER, Role.EMPRESARIO),
  validate({ query: reportFilterSchema }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, status, campaignId, page = 1, limit = 20 } = req.query as any;
      const { parsedStart, parsedEnd } = parsePeriod(startDate, endDate);
      validatePeriod(parsedStart, parsedEnd);

      const isEmpresario = req.user?.role === Role.EMPRESARIO;
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        createdAt: { gte: parsedStart, lte: parsedEnd },
      };
      if (status && status !== 'ALL') where.status = status;
      if (campaignId) where.campaignId = campaignId;

      const [donations, total, hoursAgg, byStatus, itemsByCategory] = await Promise.all([
        isEmpresario
          ? Promise.resolve([])
          : prisma.donation.findMany({
              where,
              skip,
              take: limitNum,
              orderBy: { createdAt: 'desc' },
              include: {
                items: true,
                user: { select: { id: true, name: true, email: true, role: true, matricula: true, cpf: true } },
                validatedBy: { select: { id: true, name: true } },
                campaign: { select: { id: true, title: true } },
              },
            }),
        prisma.donation.count({ where }),
        prisma.donation.aggregate({ where: { ...where, status: 'APPROVED' }, _sum: { hoursEarned: true } }),
        prisma.donation.groupBy({ by: ['status'], where, _count: true }),
        prisma.donationItem.groupBy({
          by: ['category'],
          where: { donation: where },
          _sum: { quantity: true },
          _count: true,
        }),
      ]);

      const statusSummary: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      byStatus.forEach((s) => { statusSummary[s.status] = s._count; });
      const totalItemsCount = itemsByCategory.reduce((acc, c) => acc + (c._sum.quantity || 0), 0);

      res.json({
        status: 'success',
        data: {
          summary: {
            totalDonations: total,
            ...statusSummary,
            totalHoursGranted: hoursAgg._sum?.hoursEarned || 0,
            totalItemsCollected: totalItemsCount,
            estimatedSocialImpact: {
              beneficiariesAssisted: Math.round(totalItemsCount * 0.4),
              categoriesSummary: itemsByCategory.map((c) => ({
                category: c.category,
                totalQuantity: c._sum.quantity || 0,
                recordsCount: c._count,
              })),
            },
            queryRange: { from: parsedStart.toISOString(), to: parsedEnd.toISOString() },
            retentionLimitYears: 2,
          },
          donations: isEmpresario ? undefined : donations,
          pagination: isEmpresario
            ? undefined
            : { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /reports/export/pdf — Exportação em PDF Institucional (COPER e EMPRESÁRIO)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/export/pdf',
  requireRoles(Role.COPER, Role.EMPRESARIO),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, status, campaignId } = req.query as any;
      const { parsedStart, parsedEnd } = parsePeriod(startDate, endDate);
      validatePeriod(parsedStart, parsedEnd);

      const isEmpresario = req.user?.role === Role.EMPRESARIO;
      const data = await fetchReportData(parsedStart, parsedEnd, status || 'ALL', campaignId);

      // Obter nome da campanha caso filtrada
      let campaignTitle: string | null = null;
      if (campaignId) {
        const camp = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { title: true },
        });
        campaignTitle = camp?.title || null;
      }

      const today = new Date().toISOString().slice(0, 10);
      const filename = `relatorio-coper-${today}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      doc.pipe(res);

      const logoBuffer = getLogoBuffer();
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, 45, { width: 45 });
        } catch {}
      }

      // ── Cabeçalho Institucional FMP ──
      doc.fontSize(14).font('Helvetica-Bold')
        .text('FACULDADE MUNICIPAL DE PALHOÇA — FMP', { align: 'center' });
      doc.fontSize(11).font('Helvetica')
        .text('Coordenação de Extensão e Responsabilidade Social — COPER', { align: 'center' });
      doc.fontSize(10)
        .text('Sistema COPER 3.0 — Relatório Consolidado de Doações Sociais', { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#0A3A60').lineWidth(2).stroke();
      doc.moveDown(0.5);

      // ── Metadados do Relatório ──
      doc.fontSize(9).font('Helvetica').fillColor('#444444');
      doc.text(`Período: ${parsedStart.toLocaleDateString('pt-BR')} a ${parsedEnd.toLocaleDateString('pt-BR')}`);
      doc.text(`Campanha: ${campaignTitle ? campaignTitle : 'Todas as Campanhas'}`);
      doc.text(`Filtro de Status: ${status && status !== 'ALL' ? status : 'Todos os Status'}`);
      doc.text(`Data de Emissão: ${new Date().toLocaleString('pt-BR')}`);
      doc.text(`Responsável: ${req.user?.email || 'Sistema COPER'}`);
      if (isEmpresario) {
        doc.text('Modalidade: Relatório de Impacto Social / Balanço ESG (dados agregados)');
      }
      doc.moveDown(0.8);

      // ── Resumo de Indicadores (KPIs) ──
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A3A60').text('RESUMO DE INDICADORES (KPIs)');
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
      doc.moveDown(0.3);

      const kpiRows = [
        ['Total de Doações no Período', String(data.total)],
        ['  • Aprovadas (homologadas)', String(data.statusSummary.APPROVED)],
        ['  • Pendentes de validação', String(data.statusSummary.PENDING)],
        ['  • Reprovadas', String(data.statusSummary.REJECTED)],
        ['Total de Horas Complementares Concedidas', `${data.totalHoursGranted}h`],
        ['Total de Itens Arrecadados', `${data.totalItemsCount} unidades`],
        ['Alunos Participantes (doadores)', String(data.alunosParticipantes)],
        ['Impacto Estimado (famílias / beneficiários)', `~${data.estimatedBeneficiaries} pessoas`],
      ];

      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      kpiRows.forEach(([label, value]) => {
        const y = doc.y;
        doc.text(label, 55, y, { continued: false });
        doc.text(value, 380, y, { width: 165, align: 'right' });
      });

      doc.moveDown(0.5);

      // ── Itens Arrecadados por Categoria ──
      if (data.itemsByCategory.length > 0) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A3A60').text('DISTRIBUIÇÃO DE ITENS POR CATEGORIA');
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        data.itemsByCategory.forEach((cat) => {
          const y = doc.y;
          doc.text(cat.category, 55, y);
          doc.text(`${cat._sum.quantity || 0} unidades (${cat._count} registros)`, 380, y, { width: 165, align: 'right' });
        });
        doc.moveDown(0.5);
      }

      // ── Tabela Detalhada de Doações (Exclusiva para perfil COPER) ──
      if (!isEmpresario && data.donations.length > 0) {
        doc.addPage();
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0A3A60').text('DETALHAMENTO OPERACIONAL DAS DOAÇÕES');
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
        doc.moveDown(0.3);

        const colX = [55, 160, 260, 350, 420, 480];
        const headers = ['Doador', 'Campanha', 'Itens', 'Status', 'Horas', 'Data'];
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#0A3A60');
        headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 5 : 65 }));
        doc.moveDown(0.2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#AAAAAA').lineWidth(0.3).stroke();
        doc.moveDown(0.2);

        doc.fontSize(7.5).font('Helvetica').fillColor('#333333');
        data.donations.forEach((donation, idx) => {
          if (doc.y > 750) doc.addPage();
          const y = doc.y;
          const rowBg = idx % 2 === 0 ? '#F7F9FC' : '#FFFFFF';
          doc.rect(50, y - 2, 495, 14).fill(rowBg).fillColor('#333333');

          const donorLabel = donation.donorName
            ? `${donation.donorName} (externo)`
            : (donation.user?.name || '—');
          const campTitle = donation.campaign?.title?.substring(0, 18) || 'Sem campanha';
          const itemsText = donation.items.map((it) => `${it.quantity}x ${it.description.substring(0, 12)}`).join(', ').substring(0, 28);
          const statusLabel = donation.status === 'APPROVED' ? 'Aprovada' : donation.status === 'REJECTED' ? 'Reprovada' : 'Pendente';
          const dataStr = new Date(donation.createdAt).toLocaleDateString('pt-BR');

          doc.text(donorLabel.substring(0, 18), colX[0], y, { width: 100 });
          doc.text(campTitle, colX[1], y, { width: 95 });
          doc.text(itemsText, colX[2], y, { width: 85 });
          doc.text(statusLabel, colX[3], y, { width: 65 });
          doc.text(`${donation.hoursEarned}h`, colX[4], y, { width: 55 });
          doc.text(dataStr, colX[5], y, { width: 65 });
          doc.moveDown(0.9);
        });
      }

      // ── Rodapé Institucional ──
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke();
      doc.moveDown(0.3);
      doc.fontSize(7).fillColor('#888888').font('Helvetica')
        .text(
          'Documento oficial emitido pelo Sistema COPER 3.0 — Faculdade Municipal de Palhoça (FMP). ' +
          'Registros sujeitos à política institucional de retenção de dados de 2 anos (LGPD / RNF06). ' +
          `Emitido em ${new Date().toLocaleString('pt-BR')}.`,
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /reports/export/csv — Exportação em Planilha CSV (COPER)
// Compatível com Microsoft Excel (BOM UTF-8, separador ;)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/export/csv',
  requireRoles(Role.COPER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, status, campaignId } = req.query as any;
      const { parsedStart, parsedEnd } = parsePeriod(startDate, endDate);
      validatePeriod(parsedStart, parsedEnd);

      const data = await fetchReportData(parsedStart, parsedEnd, status || 'ALL', campaignId);

      let campaignTitle: string | null = null;
      if (campaignId) {
        const camp = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { title: true },
        });
        campaignTitle = camp?.title || null;
      }

      const today = new Date().toISOString().slice(0, 10);
      const filename = `doacoes-coper-${today}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // BOM UTF-8 (\uFEFF) para forçar o Excel a reconhecer caracteres acentuados
      const BOM = '\uFEFF';

      const header = [
        'ID',
        'Doador',
        'Email',
        'Matricula',
        'Tipo Doador',
        'CPF',
        'Campanha',
        'Itens (descricao)',
        'Quantidade Total',
        'Status',
        'Horas Concedidas',
        'Data Registro',
        'Validado Por',
        'Observacao',
      ].join(';');

      const escape = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(';') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      };

      const rows = data.donations.map((d) => {
        const donorName = d.donorName || d.user?.name || '';
        const email = d.user?.email || '';
        const matricula = d.user?.matricula || '';
        const tipoDoador = d.user?.role || 'EXTERNO';
        const cpf = d.donorCpf
          ? d.donorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          : (d.user?.cpf ? d.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '');
        const campanha = d.campaign?.title || 'Sem campanha';
        const itensDesc = d.items.map((it) => `${it.quantity}x ${it.description} (${it.category})`).join(' | ');
        const qtdTotal = d.items.reduce((acc, it) => acc + it.quantity, 0);
        const statusLabel =
          d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente';
        const dataRegistro = new Date(d.createdAt).toLocaleDateString('pt-BR');
        const validadoPor = d.validatedBy?.name || '';
        const obs = d.observation || '';

        return [
          d.id.substring(0, 8),
          escape(donorName),
          escape(email),
          escape(matricula),
          escape(tipoDoador),
          escape(cpf),
          escape(campanha),
          escape(itensDesc),
          qtdTotal,
          statusLabel,
          d.hoursEarned,
          dataRegistro,
          escape(validadoPor),
          escape(obs),
        ].join(';');
      });

      const metaLines = [
        `# Relatório COPER 3.0 — Faculdade Municipal de Palhoça (FMP)`,
        `# Período: ${parsedStart.toLocaleDateString('pt-BR')} a ${parsedEnd.toLocaleDateString('pt-BR')}`,
        `# Campanha: ${campaignTitle ? campaignTitle : 'Todas as Campanhas'}`,
        `# Emitido em: ${new Date().toLocaleString('pt-BR')} por ${req.user?.email || 'Sistema COPER'}`,
        `# Total de registros: ${data.total} | Aprovadas: ${data.statusSummary.APPROVED} | Horas Concedidas: ${data.totalHoursGranted}h`,
        '#',
      ].join('\n');

      const csvContent = BOM + metaLines + '\n' + header + '\n' + rows.join('\n');
      res.send(csvContent);
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /reports/social-impact — Indicadores ESG consolidados para EMPRESARIO
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/social-impact',
  requireRoles(Role.EMPRESARIO, Role.COPER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const [approvedCount, hoursAgg, itemsByCategory, topCampaigns] = await Promise.all([
        prisma.donation.count({ where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } } }),
        prisma.donation.aggregate({
          where: { status: 'APPROVED', createdAt: { gte: oneYearAgo } },
          _sum: { hoursEarned: true },
        }),
        prisma.donationItem.groupBy({
          by: ['category'],
          where: { donation: { status: 'APPROVED', createdAt: { gte: oneYearAgo } } },
          _sum: { quantity: true },
        }),
        prisma.campaign.findMany({
          take: 5,
          where: { status: 'ACTIVE' },
          include: { _count: { select: { donations: true } }, priorityItems: true },
          orderBy: { isUrgent: 'desc' },
        }),
      ]);

      const totalItems = itemsByCategory.reduce((sum, i) => sum + (i._sum.quantity || 0), 0);

      res.json({
        status: 'success',
        data: {
          period: 'Últimos 12 meses',
          totalApprovedDonations: approvedCount,
          totalHoursVolunteered: hoursAgg._sum?.hoursEarned || 0,
          totalItemsDistributed: totalItems,
          estimatedLivesTouched: Math.round(totalItems * 0.4),
          categoryDistribution: itemsByCategory.map((c) => ({
            category: c.category,
            quantity: c._sum.quantity || 0,
          })),
          activeCampaigns: topCampaigns.map((c) => ({
            id: c.id,
            title: c.title,
            isUrgent: c.isUrgent,
            donationsCount: c._count.donations,
            priorityItemsCount: c.priorityItems.length,
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /reports/retention/cleanup — Disparo manual da retenção LGPD (COPER)
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/retention/cleanup',
  requireRoles(Role.COPER),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { cleanupExpiredDonations } = await import('../../infrastructure/jobs/retentionCleanup.js');
      const triggeredBy = `MANUAL_TRIGGER:${req.user?.email || req.user?.userId || 'COPER'}`;
      const result = await cleanupExpiredDonations(triggeredBy);

      res.json({
        status: 'success',
        message: 'Rotina de retenção de dados (2 anos / LGPD) executada com sucesso.',
        data: {
          deletedCount: result.deletedCount,
          anonymizedCount: result.anonymizedCount,
          cutoffDate: result.cutoffDate.toISOString(),
          executedAt: result.executedAt.toISOString(),
          triggeredBy: result.triggeredBy,
          executionTimeMs: result.executionTimeMs,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
