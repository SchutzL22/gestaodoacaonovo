import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { DocType } from '../../../domain/enums/index.js';

export class ValidateCertificateUseCase {
  async execute(authHash: string) {
    if (!authHash) {
      throw AppError.badRequest('Código de autenticidade (hash) não informado.');
    }

    const certificate = await prisma.certificate.findUnique({
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
      throw AppError.notFound('Documento ou certificado não encontrado ou inválido no sistema COPER 3.0.');
    }

    // Mascara o CPF para segurança e conformidade com a LGPD
    const rawCpf = certificate.user.cpf;
    const maskedCpf =
      rawCpf.length === 11
        ? `***.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-**`
        : '***.***.***-**';

    return {
      isValid: true,
      authHash: certificate.authHash,
      documentType: certificate.type,
      documentTypeName:
        certificate.type === DocType.COURSE_CERTIFICATE
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
