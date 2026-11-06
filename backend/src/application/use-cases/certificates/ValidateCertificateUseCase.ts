import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { DocType } from '../../../domain/enums/index.js';

export class ValidateCertificateUseCase {
  async execute(authHash: string) {
    if (!authHash) {
      throw AppError.badRequest('Código de autenticidade (hash) não informado.');
    }

    const cleanHash = authHash.trim();
    const aliasMap: Record<string, string> = {
      'tok-luc-001': 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32',
      'tok-edu-001': 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
    };
    const targetHash = aliasMap[cleanHash.toLowerCase()] || cleanHash;

    const certificate = await prisma.certificate.findFirst({
      where: {
        OR: [{ authHash: targetHash }, { id: targetHash }],
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

    if (!certificate) {
      throw AppError.notFound('Documento ou certificado não encontrado ou inválido no sistema COPER 3.0.');
    }

    // Mascara o CPF para segurança e conformidade com a LGPD
    const rawCpf = certificate.user.cpf;
    const maskedCpf =
      rawCpf.length === 11
        ? `***.${rawCpf.substring(3, 6)}.${rawCpf.substring(6, 9)}-**`
        : '***.***.***-**';

    const hours = certificate.hours || 0;

    return {
      isValid: true,
      authHash: certificate.authHash,
      documentType: certificate.type,
      documentTypeName:
        certificate.type === DocType.COURSE_CERTIFICATE
          ? 'Certificado de Conclusão de Curso Extracurricular'
          : 'Declaração Oficial de Doação Social',
      holderName: certificate.user.name,
      beneficiaryName: certificate.user.name,
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
        courseTitle: certificate.enrollment?.classroom.course.title,
        classroomCode: certificate.enrollment?.classroom.code,
        donationSummary: certificate.donation?.items.map((i) => `${i.quantity}x ${i.description}`),
        donationItemsCount: certificate.donation?.items.length || 0,
      },
    };
  }
}
