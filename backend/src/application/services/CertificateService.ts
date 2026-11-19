import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { DocType } from '../../domain/enums/index.js';
import { PDFGeneratorService } from '../../infrastructure/pdf/PDFGeneratorService.js';

import { ValidateCertificateUseCase } from '../use-cases/certificates/ValidateCertificateUseCase.js';

export interface PublicValidationResponse {
  isValid: boolean;
  status: string;
  authHash: string;
  beneficiaryName: string;
  beneficiaryCpfMasked: string;
  documentType: any;
  documentTypeName: string;
  title: string;
  description?: string;
  hoursCompleted: number;
  issuedAt: Date;
  details?: Record<string, unknown>;
}

export class CertificateService {
  private validateUseCase = new ValidateCertificateUseCase();

  /**
   * Validação pública e sem autenticação por hash (estilo Unisul).
   */
  async validatePublicHash(hash: string): Promise<any> {
    return this.validateUseCase.execute(hash);
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
