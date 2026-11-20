"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicValidationController = void 0;
const ValidateCertificateUseCase_js_1 = require("../../application/use-cases/certificates/ValidateCertificateUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const index_js_1 = require("../../domain/enums/index.js");
const campaignStatus_js_1 = require("../../domain/campaignStatus.js");
class PublicValidationController {
    validateUseCase = new ValidateCertificateUseCase_js_1.ValidateCertificateUseCase();
    validateDocument = async (req, res, next) => {
        try {
            const code = req.query.code || req.params.code;
            const result = await this.validateUseCase.execute(code);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    publicStats = async (req, res, next) => {
        try {
            const [totalApprovedDonations, totalHoursAgg, totalCertificates, activeCourses, completedClassrooms, totalCampaigns, activeStudents, itemsSumAgg, campaignsList, coursesList, categories, monthly, campaignTotals,] = await Promise.all([
                prisma_js_1.prisma.donation.count({ where: { status: index_js_1.DonationStatus.APPROVED } }),
                prisma_js_1.prisma.donation.aggregate({
                    where: { status: index_js_1.DonationStatus.APPROVED },
                    _sum: { hoursEarned: true },
                }),
                prisma_js_1.prisma.certificate.count(),
                prisma_js_1.prisma.course.count({ where: { status: index_js_1.CourseStatus.OPEN } }),
                prisma_js_1.prisma.classroom.count({ where: { status: index_js_1.CourseStatus.FINISHED } }),
                prisma_js_1.prisma.campaign.count(),
                prisma_js_1.prisma.user.count({ where: { role: 'ALUNO', isActive: true } }),
                prisma_js_1.prisma.donationItem.aggregate({
                    where: { donation: { status: index_js_1.DonationStatus.APPROVED } },
                    _sum: { quantity: true },
                }),
                prisma_js_1.prisma.campaign.findMany({
                    take: 6,
                    orderBy: { createdAt: 'desc' },
                    include: { priorityItems: true },
                }),
                prisma_js_1.prisma.course.findMany({
                    take: 6,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        classrooms: {
                            where: { status: index_js_1.CourseStatus.OPEN },
                            include: {
                                _count: {
                                    select: { enrollments: { where: { status: 'ACTIVE' } } },
                                },
                            },
                        },
                    },
                }),
                prisma_js_1.prisma.donationItem.groupBy({
                    by: ['category'], where: { donation: { status: index_js_1.DonationStatus.APPROVED } },
                    _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } },
                }),
                prisma_js_1.prisma.$queryRaw `
          SELECT date_trunc('month', d.created_at) AS month, sum(i.quantity)::float8 AS itens,
                 sum(d.hours_earned)::float8 AS horas
          FROM donations d
          JOIN (SELECT donation_id, sum(quantity) AS quantity FROM donation_items GROUP BY donation_id) i
            ON i.donation_id = d.id
          WHERE d.status = 'APPROVED' AND d.created_at >= date_trunc('month', now()) - interval '6 months'
          GROUP BY 1 ORDER BY 1`,
                prisma_js_1.prisma.$queryRaw `
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
                        ...c, status: (0, campaignStatus_js_1.computeCampaignStatus)(c.startDate, c.endDate, c.status),
                        currentItems: quantities.get(c.id) ?? 0,
                        targetItems: c.priorityItems.reduce((sum, item) => sum + (item.goal ?? 0), 0),
                    })),
                    courses: coursesList,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PublicValidationController = PublicValidationController;
