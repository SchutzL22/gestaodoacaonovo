"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const PDFGeneratorService_js_1 = require("../../../infrastructure/pdf/PDFGeneratorService.js");
const NotificationService_js_1 = require("../NotificationService.js");
const MailService_js_1 = require("../../../infrastructure/mail/MailService.js");
(0, vitest_1.describe)('Módulo de PDF, Notificações e Validação Pública (COPER 3.0)', () => {
    (0, vitest_1.it)('Modelo 1: deve gerar PDF de Comprovante de Doação para ALUNO contendo horas complementares', async () => {
        const buffer = await PDFGeneratorService_js_1.PDFGeneratorService.generateStudentDonationPDF({
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
        (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
        (0, vitest_1.expect)(buffer.length).toBeGreaterThan(1000);
        (0, vitest_1.expect)(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
    (0, vitest_1.it)('Modelo 2: deve gerar PDF de Comprovante de Doação para CIVIL / PROFESSOR sem menção a horas', async () => {
        const buffer = await PDFGeneratorService_js_1.PDFGeneratorService.generateCivilOrProfessorDonationPDF({
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
        (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
        (0, vitest_1.expect)(buffer.length).toBeGreaterThan(1000);
        (0, vitest_1.expect)(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
    (0, vitest_1.it)('Modelo 3: deve gerar PDF de Certificado de Conclusão de Curso Extracurricular (formato Diploma)', async () => {
        const buffer = await PDFGeneratorService_js_1.PDFGeneratorService.generateCourseCertificatePDF({
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
        (0, vitest_1.expect)(buffer).toBeInstanceOf(Buffer);
        (0, vitest_1.expect)(buffer.length).toBeGreaterThan(1000);
        (0, vitest_1.expect)(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    });
    (0, vitest_1.it)('NotificationService: deve criar, listar e marcar como lida notificações in-app', () => {
        const notif = NotificationService_js_1.NotificationService.createNotification({
            userId: 'test-user-123',
            title: 'Doação Aprovada!',
            message: 'Sua doação de 10kg de arroz gerou 5 horas complementares.',
            type: 'DONATION_APPROVED',
            link: '/validar?code=test-hash',
        });
        (0, vitest_1.expect)(notif.id).toBeDefined();
        (0, vitest_1.expect)(notif.lida).toBe(false);
        const userNotifs = NotificationService_js_1.NotificationService.getUserNotifications('test-user-123');
        (0, vitest_1.expect)(userNotifs.some((n) => n.id === notif.id)).toBe(true);
        const marked = NotificationService_js_1.NotificationService.markAsRead(notif.id, 'test-user-123');
        (0, vitest_1.expect)(marked).toBe(true);
        (0, vitest_1.expect)(notif.lida).toBe(true);
    });
    (0, vitest_1.it)('MailService: deve registrar fallback seguro em log sem estourar exceção quando SMTP ausente', async () => {
        const consoleSpy = vitest_1.vi.spyOn(console, 'log').mockImplementation(() => { });
        await MailService_js_1.MailService.sendDonationStatusNotification({
            userEmail: 'aluno@aluno.fmpsc.edu.br',
            userName: 'Aluno FMP',
            status: 'APPROVED',
            hoursEarned: 10,
            authHash: 'fake-hash-123',
            isStudent: true,
        });
        await MailService_js_1.MailService.sendDonationStatusNotification({
            userEmail: 'civil@gmail.com',
            userName: 'Cidadão Doador',
            status: 'REJECTED',
            rejectionReason: 'Itens em desacordo',
            isStudent: false,
        });
        await MailService_js_1.MailService.sendCourseCertificateNotification({
            userEmail: 'aluno@aluno.fmpsc.edu.br',
            userName: 'Aluno FMP',
            courseTitle: 'Libras Básico',
            workloadHours: 40,
            authHash: 'fake-hash-456',
        });
        consoleSpy.mockRestore();
    });
});
