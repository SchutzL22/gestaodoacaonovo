import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { DocType } from '../../domain/enums/index.js';
import { PDFGeneratorService } from '../../infrastructure/pdf/PDFGeneratorService.js';

export interface PublicValidationResponse {
  isValid: boolean;
  status: 'VÁLIDO' | 'AUTÊNTICO';
  authHash: string;
  beneficiaryName: string;
  beneficiaryCpfMasked: string;
  documentType: DocType;
  documentTypeName: string;
  title: string;
  description?: string;
  hoursCompleted: number;
  issuedAt: Date;
  details?: Record<string, unknown>;
}

export class CertificateService {
  /**
   * Validação pública e sem autenticação por hash (estilo Unisul).
   */
  async validatePublicHash(hash: string): Promise<PublicValidationResponse> {
    if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
      throw AppError.badRequest('O código verificador (hash) é obrigatório.');
    }

    const cleanHash = hash.trim();

    const cert = await prisma.certificate.findFirst({
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
      throw AppError.notFound('Documento ou certificado não encontrado. Código hash inválido ou inexistente.');
    }

    // Mascara o CPF em respeito à LGPD (ex: ***.456.789-**)
    const cpf = cert.user.cpf;
    const maskedCpf =
      cpf.length === 11
        ? `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`
        : '***.***.***-**';

    const isCourse = cert.type === DocType.COURSE_CERTIFICATE;

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

  /**
   * Emissão de certificado de curso para aluno aprovado.
   */
  async issueCourseCertificate(enrollmentId: string): Promise<string> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        classroom: {
          include: { course: true },
        },
      },
    });

    if (!enrollment) {
      throw AppError.notFound('Inscrição não encontrada.');
    }

    const authHash = uuidv4();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const validationUrl = `${frontendUrl}/validar?code=${authHash}`;

    const cert = await prisma.certificate.create({
      data: {
        userId: enrollment.studentId,
        enrollmentId: enrollment.id,
        type: DocType.COURSE_CERTIFICATE,
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

  /**
   * Gera o Buffer do PDF para visualização ou download.
   */
  async getCertificatePDF(authHash: string): Promise<{ buffer: Buffer; filename: string }> {
    const cert = await prisma.certificate.findUnique({
      where: { authHash },
      include: { user: true },
    });

    if (!cert) {
      throw AppError.notFound('Certificado não encontrado para emissão do PDF.');
    }

    const buffer = await PDFGeneratorService.generateCertificateBuffer({
      authHash: cert.authHash,
      userName: cert.user.name,
      userCpf: cert.user.cpf,
      title: cert.title,
      description: cert.description || undefined,
      type: cert.type === DocType.COURSE_CERTIFICATE ? 'COURSE_CERTIFICATE' : 'DONATION_DECLARATION',
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
