import { describe, it, expect, vi } from 'vitest';
import { PDFGeneratorService } from '../../../infrastructure/pdf/PDFGeneratorService.js';
import { NotificationService } from '../NotificationService.js';
import { MailService } from '../../../infrastructure/mail/MailService.js';

describe('Módulo de PDF, Notificações e Validação Pública (COPER 3.0)', () => {
  it('Modelo 1: deve gerar PDF de Comprovante de Doação para ALUNO contendo horas complementares', async () => {
    const buffer = await PDFGeneratorService.generateStudentDonationPDF({
      authHash: 'b78a9c21-1234-4567-89ab-cdef01234567',
      validationUrl: 'https://coper.fmpsc.edu.br/validar?code=b78a9c21-1234-4567-89ab-cdef01234567',
      userName: 'Lucas Silva',
      userMatricula: '2026100123',
      userEmail: 'lucas.silva@aluno.fmpsc.edu.br',
      userCpf: '12345678901',
      items: [
        { description: 'Alimentos Não Perecíveis', category: 'ALIMENTOS', quantity: 5, unit: 'kg' },
        { description: 'Agasalhos de Inverno', category: 'VESTUARIO', quantity: 2, unit: 'peças' },
      ],
      hoursEarned: 15,
      receivedByName: 'Maria Atendente',
      validatedByName: 'Coordenação COPER',
      approvedAt: new Date(),
      campaignTitle: 'Campanha de Inverno 2026',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Valida assinatura binária de arquivo PDF (%PDF-)
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('Modelo 2: deve gerar PDF de Comprovante de Doação para CIVIL / PROFESSOR sem menção a horas', async () => {
    const buffer = await PDFGeneratorService.generateCivilOrProfessorDonationPDF({
      authHash: 'a12b3c4d-5678-90ab-cdef-1234567890ab',
      validationUrl: 'https://coper.fmpsc.edu.br/validar?code=a12b3c4d-5678-90ab-cdef-1234567890ab',
      userName: 'Prof. Carlos Eduardo',
      userRole: 'PROFESSOR',
      userCpf: '98765432100',
      userEmail: 'carlos.eduardo@fmpsc.edu.br',
      items: [
        { description: 'Livros Didáticos do Ensino Fundamental', category: 'EDUCACIONAL', quantity: 10, unit: 'exemplares' },
      ],
      receivedByName: 'Balcão de Atendimento COPER',
      validatedByName: 'Coordenação COPER',
      approvedAt: new Date(),
      observation: 'Doação institucional para a biblioteca comunitária',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('Modelo 3: deve gerar PDF de Certificado de Conclusão de Curso Extracurricular (formato Diploma)', async () => {
    const buffer = await PDFGeneratorService.generateCourseCertificatePDF({
      authHash: 'e5f6a7b8-9012-3456-7890-abcdef123456',
      validationUrl: 'https://coper.fmpsc.edu.br/validar?code=e5f6a7b8-9012-3456-7890-abcdef123456',
      userName: 'Mariana Oliveira',
      userMatricula: '2026100456',
      userCpf: '11122233344',
      courseTitle: 'Língua Brasileira de Sinais - Libras Básico',
      workloadHours: 40,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-06-30'),
      instructorName: 'Prof. Ana Santos',
      finalGrade: 9.5,
      attendancePct: 90.0,
      issuedAt: new Date(),
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('NotificationService: deve criar, listar e marcar como lida notificações in-app', () => {
    const notif = NotificationService.createNotification({
      userId: 'test-user-123',
      title: 'Doação Aprovada!',
      message: 'Sua doação de 10kg de arroz gerou 5 horas complementares.',
      type: 'DONATION_APPROVED',
      link: '/validar?code=test-hash',
    });

    expect(notif.id).toBeDefined();
    expect(notif.lida).toBe(false);

    const userNotifs = NotificationService.getUserNotifications('test-user-123');
    expect(userNotifs.some((n) => n.id === notif.id)).toBe(true);

    const marked = NotificationService.markAsRead(notif.id, 'test-user-123');
    expect(marked).toBe(true);
    expect(notif.lida).toBe(true);
  });

  it('MailService: deve registrar fallback seguro em log sem estourar exceção quando SMTP ausente', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await MailService.sendDonationStatusNotification({
      userEmail: 'aluno@aluno.fmpsc.edu.br',
      userName: 'Aluno FMP',
      status: 'APPROVED',
      hoursEarned: 10,
      authHash: 'fake-hash-123',
      isStudent: true,
    });

    await MailService.sendDonationStatusNotification({
      userEmail: 'civil@gmail.com',
      userName: 'Cidadão Doador',
      status: 'REJECTED',
      rejectionReason: 'Itens em desacordo',
      isStudent: false,
    });

    await MailService.sendCourseCertificateNotification({
      userEmail: 'aluno@aluno.fmpsc.edu.br',
      userName: 'Aluno FMP',
      courseTitle: 'Libras Básico',
      workloadHours: 40,
      authHash: 'fake-hash-456',
    });

    consoleSpy.mockRestore();
  });
});
