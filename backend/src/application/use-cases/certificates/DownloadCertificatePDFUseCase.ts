import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { PDFGeneratorService } from '../../../infrastructure/pdf/PDFGeneratorService.js';
import { DocType } from '../../../domain/enums/index.js';

export class DownloadCertificatePDFUseCase {
  async execute(certificateIdOrHash: string, requesterUserId?: string, requesterRole?: string) {
    // Busca por id ou por authHash
    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ id: certificateIdOrHash }, { authHash: certificateIdOrHash }],
      },
      include: {
        user: true,
      },
    });

    if (!certificate) {
      throw AppError.notFound('Certificado não encontrado.');
    }

    // Regra de privacidade: Aluno só baixa o seu próprio documento, a menos que seja COPER ou PROFESSOR
    if (
      requesterUserId &&
      requesterRole === 'ALUNO' &&
      certificate.userId !== requesterUserId
    ) {
      throw AppError.forbidden('Você não tem permissão para baixar certificados de outros alunos.');
    }

    const pdfBuffer = await PDFGeneratorService.generateCertificateBuffer({
      authHash: certificate.authHash,
      userName: certificate.user.name,
      userCpf: certificate.user.cpf,
      title: certificate.title,
      description: certificate.description || undefined,
      type: certificate.type === DocType.COURSE_CERTIFICATE ? 'COURSE_CERTIFICATE' : 'DONATION_DECLARATION',
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
