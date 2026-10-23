"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
const PDFGeneratorService_js_1 = require("../../infrastructure/pdf/PDFGeneratorService.js");
class CertificateService {
    async validatePublicHash(hash) {
        if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
            throw AppError_js_1.AppError.badRequest('O código verificador (hash) é obrigatório.');
        }
        const cleanHash = hash.trim();
        const cert = await prisma_js_1.prisma.certificate.findFirst({
            where: {
                OR: [{ authHash: cleanHash }, { id: cleanHash }],
            },
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
        if (!cert) {
            throw AppError_js_1.AppError.notFound('Documento ou certificado não encontrado. Código hash inválido ou inexistente.');
        }
        const cpf = cert.user.cpf;
        const maskedCpf = cpf.length === 11
            ? `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`
            : '***.***.***-**';
        const isCourse = cert.type === index_js_1.DocType.COURSE_CERTIFICATE;
        return {
            isValid: true,
            status: 'AUTÊNTICO',
            authHash: cert.authHash,
            beneficiaryName: cert.user.name,
            beneficiaryCpfMasked: maskedCpf,
            documentType: cert.type,
            documentTypeName: isCourse
                ? 'Certificado Oficial de Conclusão de Curso Extracurricular'
                : 'Declaração Institucional de Doação e Ação Social',
            title: cert.title,
            description: cert.description || undefined,
            hoursCompleted: cert.hours || 0,
            issuedAt: cert.issuedAt,
            details: {
                courseTitle: cert.enrollment?.classroom.course.title,
                classroomCode: cert.enrollment?.classroom.code,
                donationItemsCount: cert.donation?.items.length,
            },
        };
    }
    async issueCourseCertificate(enrollmentId) {
        const enrollment = await prisma_js_1.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                student: true,
                classroom: {
                    include: { course: true },
                },
            },
        });
        if (!enrollment) {
            throw AppError_js_1.AppError.notFound('Inscrição não encontrada.');
        }
        const authHash = (0, uuid_1.v4)();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const validationUrl = `${frontendUrl}/validar?code=${authHash}`;
        const cert = await prisma_js_1.prisma.certificate.create({
            data: {
                userId: enrollment.studentId,
                enrollmentId: enrollment.id,
                type: index_js_1.DocType.COURSE_CERTIFICATE,
                authHash,
                validationUrl,
                title: `Certificado de Extensão - ${enrollment.classroom.course.title}`,
                description: `Conclusão do curso extracurricular ${enrollment.classroom.course.title} com carga horária de ${enrollment.classroom.course.workloadHours} horas.`,
                hours: enrollment.classroom.course.workloadHours,
                metadata: {
                    studentName: enrollment.student.name,
                    courseTitle: enrollment.classroom.course.title,
                    classroomCode: enrollment.classroom.code,
                },
            },
        });
        return cert.authHash;
    }
    async getCertificatePDF(authHash) {
        const cert = await prisma_js_1.prisma.certificate.findUnique({
            where: { authHash },
            include: { user: true },
        });
        if (!cert) {
            throw AppError_js_1.AppError.notFound('Certificado não encontrado para emissão do PDF.');
        }
        const buffer = await PDFGeneratorService_js_1.PDFGeneratorService.generateCertificateBuffer({
            authHash: cert.authHash,
            userName: cert.user.name,
            userCpf: cert.user.cpf,
            title: cert.title,
            description: cert.description || undefined,
            type: cert.type === index_js_1.DocType.COURSE_CERTIFICATE ? 'COURSE_CERTIFICATE' : 'DONATION_DECLARATION',
            hours: cert.hours || 0,
            issuedAt: cert.issuedAt,
            validationUrl: cert.validationUrl,
        });
        return {
            buffer,
            filename: `COPER_${cert.type}_${cert.authHash.substring(0, 8)}.pdf`,
        };
    }
}
exports.CertificateService = CertificateService;
