"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateController = void 0;
const DownloadCertificatePDFUseCase_js_1 = require("../../application/use-cases/certificates/DownloadCertificatePDFUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
const CertificateService_js_1 = require("../../application/services/CertificateService.js");
class CertificateController {
    downloadPdfUseCase = new DownloadCertificatePDFUseCase_js_1.DownloadCertificatePDFUseCase();
    certificateService = new CertificateService_js_1.CertificateService();
    validate = async (req, res, next) => {
        try {
            const hash = (req.params.hash || req.query.code);
            const result = await this.certificateService.validatePublicHash(hash);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const skip = (page - 1) * limit;
            const whereClause = req.user.role === index_js_1.UserRole.COPER
                ? {}
                : { userId: req.user.userId };
            const [certificates, total] = await Promise.all([
                prisma_js_1.prisma.certificate.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: { id: true, name: true, email: true, cpf: true },
                        },
                        donation: true,
                        enrollment: {
                            include: {
                                classroom: {
                                    include: { course: true },
                                },
                            },
                        },
                    },
                    orderBy: { issuedAt: 'desc' },
                }),
                prisma_js_1.prisma.certificate.count({ where: whereClause }),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                status: 'success',
                data: {
                    certificates,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    downloadPdf = async (req, res, next) => {
        try {
            const id = req.params.id;
            const result = await this.downloadPdfUseCase.execute(id, req.user?.userId, req.user?.role);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
            res.send(result.pdfBuffer);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CertificateController = CertificateController;
