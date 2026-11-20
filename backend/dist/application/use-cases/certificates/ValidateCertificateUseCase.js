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
        const cleanHash = authHash.trim();
        const aliasMap = {
            'tok-luc-001': 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32',
            'tok-edu-001': 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
        };
        const targetHash = aliasMap[cleanHash.toLowerCase()] || cleanHash;
        const certificate = await prisma_js_1.prisma.certificate.findFirst({
            where: {
                OR: [{ authHash: targetHash }, { id: targetHash }],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        cpf: true,
                        role: true,
                        matricula: true,
                        email: true,
                    },
                },
                donation: {
                    include: {
                        items: true,
                        validatedBy: {
                            select: { name: true, email: true },
                        },
                        campaign: {
                            select: { title: true },
                        },
                    },
                },
                enrollment: {
                    include: {
                        classroom: {
                            include: {
                                course: {
                                    include: { instructor: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (certificate) {
            const rawCpf = certificate.donation?.donorCpf || certificate.user.cpf;
            const maskedCpf = rawCpf && rawCpf.length === 11
                ? `***.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-**`
                : '***.***.***-**';
            const isCourse = certificate.type === index_js_1.DocType.COURSE_CERTIFICATE;
            const isStudent = certificate.user.role === index_js_1.UserRole.ALUNO;
            const hours = isStudent || isCourse ? certificate.hours || 0 : 0;
            let docTypeName = '';
            if (isCourse) {
                docTypeName = 'Certificado de Conclusão de Curso Extracurricular';
            }
            else if (isStudent) {
                docTypeName = 'Comprovante Oficial de Doação e Horas Complementares';
            }
            else {
                docTypeName = 'Comprovante de Doação e Responsabilidade Social';
            }
            return {
                isValid: true,
                authHash: certificate.authHash,
                documentType: certificate.type,
                documentTypeName: docTypeName,
                isStudent,
                holderName: certificate.donation?.donorName || certificate.user.name,
                beneficiaryName: certificate.donation?.donorName || certificate.user.name,
                holderCpfMasked: maskedCpf,
                beneficiaryCpfMasked: maskedCpf,
                title: certificate.title,
                description: certificate.description,
                hoursEarned: hours,
                hoursCompleted: hours,
                issuedAt: certificate.issuedAt,
                status: 'AUTÊNTICO E VERIFICADO',
                details: {
                    metadata: certificate.metadata,
                    matricula: certificate.user.matricula,
                    role: certificate.user.role,
                    courseTitle: certificate.enrollment?.classroom.course.title,
                    classroomCode: certificate.enrollment?.classroom.code,
                    instructorName: certificate.enrollment?.classroom.course.instructor?.name,
                    campaignTitle: certificate.donation?.campaign?.title,
                    validatedByName: certificate.donation?.validatedBy?.name,
                    donationSummary: certificate.donation?.items.map((i) => `${i.quantity}x ${i.description}`),
                    donationItemsCount: certificate.donation?.items.length || 0,
                    items: certificate.donation?.items.map((i) => ({
                        description: i.description,
                        category: i.category,
                        quantity: i.quantity,
                        unit: i.unit,
                    })),
                },
            };
        }
        const donation = await prisma_js_1.prisma.donation.findFirst({
            where: {
                OR: [{ authHash: targetHash }, { id: targetHash }],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        cpf: true,
                        role: true,
                        matricula: true,
                        email: true,
                    },
                },
                items: true,
                validatedBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
                receivedBy: {
                    select: { id: true, name: true, email: true },
                },
                campaign: {
                    select: { id: true, title: true },
                },
            },
        });
        if (donation) {
            if (donation.status !== index_js_1.DonationStatus.APPROVED) {
                if (donation.status === index_js_1.DonationStatus.PENDING) {
                    throw AppError_js_1.AppError.badRequest('Esta doação foi localizada no sistema COPER, mas ainda está pendente de conferência física e homologação.');
                }
                if (donation.status === index_js_1.DonationStatus.REJECTED) {
                    throw AppError_js_1.AppError.badRequest(`Esta solicitação de doação não foi homologada pelo COPER. Motivo: ${donation.rejectionReason || 'Não especificado.'}`);
                }
            }
            const rawCpf = donation.donorCpf || donation.user.cpf;
            const maskedCpf = rawCpf && rawCpf.replace(/\D/g, '').length === 11
                ? `***.${rawCpf.replace(/\D/g, '').substring(3, 6)}.${rawCpf.replace(/\D/g, '').substring(6, 9)}-**`
                : '***.***.***-**';
            const isStudent = donation.user.role === index_js_1.UserRole.ALUNO;
            const hours = isStudent ? donation.hoursEarned || 0 : 0;
            const beneficiaryName = donation.donorName || donation.user.name;
            const docTypeName = isStudent
                ? 'Comprovante Oficial de Doação e Horas Complementares'
                : 'Comprovante de Doação e Responsabilidade Social';
            const title = donation.campaign
                ? `Doação Homologada - ${donation.campaign.title}`
                : 'Comprovante Oficial de Doação Solidária';
            const description = isStudent
                ? `Doação solidária conferida pela equipe COPER com homologação de ${hours} horas complementares de extensão acadêmica.`
                : 'Doação voluntária de responsabilidade social homologada pela equipe COPER em prol da comunidade regional.';
            return {
                isValid: true,
                authHash: donation.authHash,
                documentType: isStudent ? index_js_1.DocType.DONATION_DECLARATION : 'DONATION_CIVIL_PROFESSOR',
                documentTypeName: docTypeName,
                isStudent,
                holderName: beneficiaryName,
                beneficiaryName,
                holderCpfMasked: maskedCpf,
                beneficiaryCpfMasked: maskedCpf,
                title,
                description,
                hoursEarned: hours,
                hoursCompleted: hours,
                issuedAt: donation.updatedAt || donation.createdAt,
                status: 'AUTÊNTICO E VERIFICADO',
                details: {
                    isStudent,
                    donorRole: donation.user.role,
                    matricula: donation.user.matricula,
                    campaignTitle: donation.campaign?.title,
                    validatedByName: donation.validatedBy?.name || 'Coordenação COPER / FMP',
                    receivedByName: donation.receivedBy?.name || 'Balcão de Atendimento COPER',
                    donationSummary: donation.items.map((i) => `${i.quantity}x ${i.description}`),
                    donationItemsCount: donation.items.length,
                    items: donation.items.map((i) => ({
                        description: i.description,
                        category: i.category,
                        quantity: i.quantity,
                        unit: i.unit,
                    })),
                },
            };
        }
        throw AppError_js_1.AppError.notFound('Documento ou certificado não encontrado ou inválido no sistema COPER 3.0.');
    }
}
exports.ValidateCertificateUseCase = ValidateCertificateUseCase;
