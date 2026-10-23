"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadCertificatePDFUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const PDFGeneratorService_js_1 = require("../../../infrastructure/pdf/PDFGeneratorService.js");
const index_js_1 = require("../../../domain/enums/index.js");
class DownloadCertificatePDFUseCase {
    async execute(certificateIdOrHash, requesterUserId, requesterRole) {
        const certificate = await prisma_js_1.prisma.certificate.findFirst({
            where: {
                OR: [{ id: certificateIdOrHash }, { authHash: certificateIdOrHash }],
            },
            include: {
                user: true,
            },
        });
        if (!certificate) {
            throw AppError_js_1.AppError.notFound('Certificado não encontrado.');
        }
        if (requesterUserId &&
            requesterRole === 'ALUNO' &&
            certificate.userId !== requesterUserId) {
            throw AppError_js_1.AppError.forbidden('Você não tem permissão para baixar certificados de outros alunos.');
        }
        const pdfBuffer = await PDFGeneratorService_js_1.PDFGeneratorService.generateCertificateBuffer({
            authHash: certificate.authHash,
            userName: certificate.user.name,
            userCpf: certificate.user.cpf,
            title: certificate.title,
            description: certificate.description || undefined,
            type: certificate.type === index_js_1.DocType.COURSE_CERTIFICATE ? 'COURSE_CERTIFICATE' : 'DONATION_DECLARATION',
            hours: certificate.hours || 0,
            issuedAt: certificate.issuedAt,
            validationUrl: certificate.validationUrl,
        });
        return {
            pdfBuffer,
            filename: `COPER_${certificate.type}_${certificate.authHash.substring(0, 8)}.pdf`,
        };
    }
}
exports.DownloadCertificatePDFUseCase = DownloadCertificatePDFUseCase;
