"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicValidationController = void 0;
const ValidateCertificateUseCase_js_1 = require("../../application/use-cases/certificates/ValidateCertificateUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
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
            const [totalDonations, totalHours, totalCertificates, activeCourses] = await Promise.all([
                prisma_js_1.prisma.donation.count({ where: { status: 'APPROVED' } }),
                prisma_js_1.prisma.donation.aggregate({
                    where: { status: 'APPROVED' },
                    _sum: { hoursEarned: true },
                }),
                prisma_js_1.prisma.certificate.count(),
                prisma_js_1.prisma.course.count(),
            ]);
            res.status(200).json({
                status: 'success',
                data: {
                    impact: {
                        totalApprovedDonations: totalDonations,
                        totalHoursGranted: totalHours._sum?.hoursEarned || 0,
                        totalCertificatesIssued: totalCertificates,
                        activeCourses,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PublicValidationController = PublicValidationController;
