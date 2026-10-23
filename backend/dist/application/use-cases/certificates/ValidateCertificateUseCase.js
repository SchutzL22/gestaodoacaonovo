"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateCertificateUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
class ValidateCertificateUseCase {
    async execute(authHash) {
        if (!authHash) {
            throw AppError_js_1.AppError.badRequest('Código de autenticidade (hash) não informado.');
        }
        const certificate = await prisma_js_1.prisma.certificate.findUnique({
            where: { authHash },
            include: {
                user: {
                    select: {
                        name: true,
                        cpf: true,
                        role: true,
                    },
                },
                donation: {
                    include: {
                        items: true,
                    },
                },
                enrollment: {
                    include: {
                        classroom: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
        });
        if (!certificate) {
            throw AppError_js_1.AppError.notFound('Documento ou certificado não encontrado ou inválido no sistema COPER 3.0.');
        }
        const rawCpf = certificate.user.cpf;
        const maskedCpf = rawCpf.length === 11
            ? `***.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-**`
            : '***.***.***-**';
        return {
            isValid: true,
            authHash: certificate.authHash,
            documentType: certificate.type,
            documentTypeName: certificate.type === index_js_1.DocType.COURSE_CERTIFICATE
                ? 'Certificado de Conclusão de Curso Extracurricular'
                : 'Declaração Oficial de Doação Social',
            holderName: certificate.user.name,
            holderCpfMasked: maskedCpf,
            title: certificate.title,
            description: certificate.description,
            hoursEarned: certificate.hours || 0,
            issuedAt: certificate.issuedAt,
            status: 'AUTÊNTICO E VERIFICADO',
            details: {
                metadata: certificate.metadata,
                courseTitle: certificate.enrollment?.classroom.course.title,
                donationSummary: certificate.donation?.items.map((i) => `${i.quantity}x ${i.description}`),
            },
        };
    }
}
exports.ValidateCertificateUseCase = ValidateCertificateUseCase;
