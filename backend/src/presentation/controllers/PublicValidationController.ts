import { Request, Response, NextFunction } from 'express';
import { ValidateCertificateUseCase } from '../../application/use-cases/certificates/ValidateCertificateUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { DonationStatus, CourseStatus } from '../../domain/enums/index.js';
import { computeCampaignStatus } from '../routes/campaignRoutes.js';

export class PublicValidationController {
  private validateUseCase = new ValidateCertificateUseCase();

  validateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = (req.query.code as string) || (req.params.code as string);
      const result = await this.validateUseCase.execute(code);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  publicStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalApprovedDonations,
        totalHoursAgg,
        totalCertificates,
        activeCourses,
        completedClassrooms,
        totalCampaigns,
        activeStudents,
        itemsSumAgg,
        campaignsList,
        coursesList, categories, monthly, campaignTotals,
      ] = await Promise.all([
        prisma.donation.count({ where: { status: DonationStatus.APPROVED } }),
        prisma.donation.aggregate({
          where: { status: DonationStatus.APPROVED },
          _sum: { hoursEarned: true },
        }),
        prisma.certificate.count(),
        prisma.course.count({ where: { status: CourseStatus.OPEN } }),
        prisma.classroom.count({ where: { status: CourseStatus.FINISHED } }),
        prisma.campaign.count(),
        prisma.user.count({ where: { role: 'ALUNO', isActive: true } }),
        prisma.donationItem.aggregate({
          where: { donation: { status: DonationStatus.APPROVED } },
          _sum: { quantity: true },
        }),
        prisma.campaign.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: { priorityItems: true },
        }),
        prisma.course.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            classrooms: {
              where: { status: CourseStatus.OPEN },
              include: {
                _count: {
                  select: { enrollments: { where: { status: 'ACTIVE' } } },
                },
              },
            },
          },
        }),
        prisma.donationItem.groupBy({
          by: ['category'], where: { donation: { status: DonationStatus.APPROVED } },
          _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } },
        }),
        prisma.$queryRaw<{ month: Date; itens: number; horas: number }[]>`
          SELECT date_trunc('month', d.created_at) AS month, sum(i.quantity)::float8 AS itens,
                 sum(d.hours_earned)::float8 AS horas
          FROM donations d
          JOIN (SELECT donation_id, sum(quantity) AS quantity FROM donation_items GROUP BY donation_id) i
            ON i.donation_id = d.id
          WHERE d.status = 'APPROVED' AND d.created_at >= date_trunc('month', now()) - interval '6 months'
          GROUP BY 1 ORDER BY 1`,
        prisma.$queryRaw<{ id: string; quantity: number }[]>`
          SELECT d.campaign_id AS id, sum(i.quantity)::float8 AS quantity
          FROM donations d JOIN donation_items i ON i.donation_id = d.id
          WHERE d.status = 'APPROVED' AND d.campaign_id IS NOT NULL GROUP BY d.campaign_id`,
      ]);

      const totalItems = itemsSumAgg._sum.quantity ?? 0;
      const quantities = new Map(campaignTotals.map(c => [c.id, c.quantity]));
      res.json({
        status: 'success',
        data: {
          impact: {
            totalApprovedDonations, totalItemsDonated: totalItems, totalHoursGranted: totalHoursAgg._sum.hoursEarned ?? 0,
            totalCertificatesIssued: totalCertificates, activeCourses, completedCourses: completedClassrooms,
            totalCampaigns, activeStudents, familiesHelped: Math.round(totalItems / 24),
          },
          categories: categories.map(c => ({
            name: c.category, value: c._sum.quantity ?? 0,
            pct: totalItems ? Math.round(100 * (c._sum.quantity ?? 0) / totalItems) + '%' : '0%',
          })),
          monthly: monthly.map(row => ({
            mes: row.month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
            itens: row.itens, horas: row.horas,
          })),
          campaigns: campaignsList.map(c => ({
            ...c, status: computeCampaignStatus(c.startDate, c.endDate, c.status),
            currentItems: quantities.get(c.id) ?? 0,
            targetItems: c.priorityItems.reduce((sum, item) => sum + (item.goal ?? 0), 0),
          })),
          courses: coursesList,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
