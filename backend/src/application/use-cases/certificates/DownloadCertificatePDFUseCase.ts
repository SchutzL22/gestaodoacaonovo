import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { PDFGeneratorService } from '../../../infrastructure/pdf/PDFGeneratorService.js';
import { DocType, DonationStatus, UserRole } from '../../../domain/enums/index.js';

export class DownloadCertificatePDFUseCase {
  async execute(certificateIdOrHash: string, requesterUserId?: string, requesterRole?: string) {
    const clean = (certificateIdOrHash || '').trim();
    const aliasMap: Record<string, string> = {
      'tok-luc-001': 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32',
      'tok-edu-001': 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
    };
    const target = aliasMap[clean.toLowerCase()] || clean;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // 1. Busca por id ou por authHash na tabela Certificate
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: target }, { authHash: target }],
      },
      include: {
        user: true,
        donation: {
          include: {
            items: true,
            validatedBy: true,
            campaign: true,
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
      // Regra de privacidade: Aluno só baixa o seu próprio documento, a menos que seja COPER ou PROFESSOR
      if (
        requesterUserId &&
        requesterRole === UserRole.ALUNO &&
        certificate.userId !== requesterUserId
      ) {
        throw AppError.forbidden('Você não tem permissão para baixar documentos de outros usuários.');
      }

      const isCourse = certificate.type === DocType.COURSE_CERTIFICATE;
      const isStudent = certificate.user.role === UserRole.ALUNO;

      let pdfBuffer: Buffer;

      if (isCourse) {
        pdfBuffer = await PDFGeneratorService.generateCourseCertificatePDF({
          authHash: certificate.authHash,
          validationUrl: certificate.validationUrl || `${frontendUrl}/validar?code=${certificate.authHash}`,
          userName: certificate.user.name,
          userMatricula: certificate.user.matricula,
          userCpf: certificate.user.cpf,
          courseTitle: certificate.enrollment?.classroom.course.title || certificate.title,
          workloadHours: certificate.enrollment?.classroom.course.workloadHours || certificate.hours || 40,
          startDate: certificate.enrollment?.classroom.startDate,
          endDate: certificate.enrollment?.classroom.endDate,
          instructorName: certificate.enrollment?.classroom.course.instructor?.name || 'Coordenação de Extensão COPER',
          finalGrade: certificate.enrollment?.finalGrade,
          attendancePct: certificate.enrollment?.attendancePercentage,
          issuedAt: certificate.issuedAt,
        });
      } else if (isStudent) {
        pdfBuffer = await PDFGeneratorService.generateStudentDonationPDF({
          authHash: certificate.authHash,
          validationUrl: certificate.validationUrl || `${frontendUrl}/validar?code=${certificate.authHash}`,
          userName: certificate.donation?.donorName || certificate.user.name,
          userMatricula: certificate.user.matricula,
          userEmail: certificate.user.email,
          userCpf: certificate.donation?.donorCpf || certificate.user.cpf,
          items: certificate.donation?.items.map((i) => ({
            description: i.description,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit || 'un.',
          })) || [{ description: 'Doação Solidária', quantity: 1, unit: 'itens' }],
          hoursEarned: certificate.hours || 0,
          receivedByName: 'Balcão de Atendimento COPER',
          validatedByName: certificate.donation?.validatedBy?.name || 'Coordenação COPER FMP',
          approvedAt: certificate.issuedAt,
          campaignTitle: certificate.donation?.campaign?.title || certificate.title,
        });
      } else {
        pdfBuffer = await PDFGeneratorService.generateCivilOrProfessorDonationPDF({
          authHash: certificate.authHash,
          validationUrl: certificate.validationUrl || `${frontendUrl}/validar?code=${certificate.authHash}`,
          userName: certificate.donation?.donorName || certificate.user.name,
          userRole: (certificate.user.role as any) || 'CIVIL',
          userCpf: certificate.donation?.donorCpf || certificate.user.cpf,
          userEmail: certificate.user.email,
          items: certificate.donation?.items.map((i) => ({
            description: i.description,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit || 'un.',
          })) || [{ description: 'Doação Solidária', quantity: 1, unit: 'itens' }],
          receivedByName: 'Balcão de Atendimento COPER',
          validatedByName: certificate.donation?.validatedBy?.name || 'Coordenação COPER FMP',
          approvedAt: certificate.issuedAt,
          observation: certificate.description,
          campaignTitle: certificate.donation?.campaign?.title || certificate.title,
        });
      }

      return {
        pdfBuffer,
        filename: `COPER_${certificate.type}_${certificate.authHash.substring(0, 8)}.pdf`,
      };
    }

    // 2. Se não encontrar em Certificate, busca em Donation aprovada
    const donation = await prisma.donation.findFirst({
      where: {
        OR: [{ id: target }, { authHash: target }],
      },
      include: {
        user: true,
        items: true,
        validatedBy: true,
        campaign: true,
      },
    });

    if (!donation) {
      throw AppError.notFound('Certificado ou comprovante de doação não encontrado.');
    }

    if (donation.status !== DonationStatus.APPROVED) {
      throw AppError.badRequest('O comprovante em PDF só pode ser emitido para doações com status APROVADA.');
    }

    if (
      requesterUserId &&
      requesterRole === UserRole.ALUNO &&
      donation.userId !== requesterUserId
    ) {
      throw AppError.forbidden('Você não tem permissão para baixar comprovantes de outros alunos.');
    }

    const isStudent = donation.user.role === UserRole.ALUNO;
    const validationUrl = `${frontendUrl}/validar?code=${donation.authHash}`;
    let pdfBuffer: Buffer;

    if (isStudent) {
      pdfBuffer = await PDFGeneratorService.generateStudentDonationPDF({
        authHash: donation.authHash,
        validationUrl,
        userName: donation.donorName || donation.user.name,
        userMatricula: donation.user.matricula,
        userEmail: donation.user.email,
        userCpf: donation.donorCpf || donation.user.cpf,
        items: donation.items.map((i) => ({
          description: i.description,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit || 'un.',
        })),
        hoursEarned: donation.hoursEarned || 0,
        receivedByName: 'Balcão de Atendimento COPER',
        validatedByName: donation.validatedBy?.name || 'Coordenação COPER FMP',
        approvedAt: donation.updatedAt || donation.createdAt,
        campaignTitle: donation.campaign?.title || 'Campanha Solidária COPER',
      });
    } else {
      pdfBuffer = await PDFGeneratorService.generateCivilOrProfessorDonationPDF({
        authHash: donation.authHash,
        validationUrl,
        userName: donation.donorName || donation.user.name,
        userRole: (donation.user.role as any) || 'CIVIL',
        userCpf: donation.donorCpf || donation.user.cpf,
        userEmail: donation.user.email,
        items: donation.items.map((i) => ({
          description: i.description,
          category: i.category,
          quantity: i.quantity,
          unit: i.unit || 'un.',
        })),
        receivedByName: 'Balcão de Atendimento COPER',
        validatedByName: donation.validatedBy?.name || 'Coordenação COPER FMP',
        approvedAt: donation.updatedAt || donation.createdAt,
        observation: donation.observation,
        campaignTitle: donation.campaign?.title || 'Campanha Solidária COPER',
      });
    }

    return {
      pdfBuffer,
      filename: `COPER_Comprovante_Doacao_${donation.authHash.substring(0, 8)}.pdf`,
    };
  }
}
