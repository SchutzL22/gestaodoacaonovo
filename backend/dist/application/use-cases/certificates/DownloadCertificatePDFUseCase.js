"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadCertificatePDFUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const PDFGeneratorService_js_1 = require("../../../infrastructure/pdf/PDFGeneratorService.js");
const index_js_1 = require("../../../domain/enums/index.js");
class DownloadCertificatePDFUseCase {
    async execute(certificateIdOrHash, requesterUserId, requesterRole) {
        const clean = (certificateIdOrHash || '').trim();
        const aliasMap = {
            'tok-luc-001': 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32',
            'tok-edu-001': 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
        };
        const target = aliasMap[clean.toLowerCase()] || clean;
        const certificate = await prisma_js_1.prisma.certificate.findFirst({
            where: {
                OR: [{ id: target }, { authHash: target }],
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
