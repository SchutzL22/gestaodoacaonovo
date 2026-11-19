"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_dto_js_1 = require("../../dtos/auth.dto.js");
const donation_dto_js_1 = require("../../dtos/donation.dto.js");
const index_js_1 = require("../../../domain/enums/index.js");
(0, vitest_1.describe)('Sistema COPER 3.0 - Validação de Perfis e RBAC', () => {
    (0, vitest_1.it)('deve aceitar cadastro de ALUNO com e-mail institucional e matrícula válida', () => {
        const validAluno = {
            name: 'João da Silva',
            email: 'joao.silva@aluno.fmpsc.edu.br',
            cpf: '123.456.789-00',
            password: 'password123',
            role: index_js_1.Role.ALUNO,
            matricula: '20261010',
        };
        const parsed = auth_dto_js_1.registerSchema.safeParse(validAluno);
        (0, vitest_1.expect)(parsed.success).toBe(true);
        if (parsed.success) {
            (0, vitest_1.expect)(parsed.data.cpf).toBe('12345678900');
        }
    });
    (0, vitest_1.it)('deve rejeitar cadastro de ALUNO sem matrícula', () => {
        const invalidAluno = {
            name: 'João da Silva',
            email: 'joao.silva@aluno.fmpsc.edu.br',
            cpf: '123.456.789-00',
            password: 'password123',
            role: index_js_1.Role.ALUNO,
        };
        const parsed = auth_dto_js_1.registerSchema.safeParse(invalidAluno);
        (0, vitest_1.expect)(parsed.success).toBe(false);
    });
    (0, vitest_1.it)('deve rejeitar cadastro de ALUNO com e-mail não institucional (ex: gmail)', () => {
        const invalidAluno = {
            name: 'João da Silva',
            email: 'joao.silva@gmail.com',
            cpf: '123.456.789-00',
            password: 'password123',
            role: index_js_1.Role.ALUNO,
            matricula: '20261010',
        };
        const parsed = auth_dto_js_1.registerSchema.safeParse(invalidAluno);
        (0, vitest_1.expect)(parsed.success).toBe(false);
    });
    (0, vitest_1.it)('deve aceitar cadastro de PROFESSOR com e-mail @fmpsc.edu.br', () => {
        const validProf = {
            name: 'Prof. Carlos',
            email: 'carlos@fmpsc.edu.br',
            cpf: '123.456.789-11',
            password: 'password123',
            role: index_js_1.Role.PROFESSOR,
        };
        const parsed = auth_dto_js_1.registerSchema.safeParse(validProf);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve aceitar cadastro de CIVIL com e-mail pessoal e endereço residencial', () => {
        const validCivil = {
            name: 'Maria de Lourdes',
            email: 'maria.lourdes@gmail.com',
            cpf: '987.654.321-00',
            password: 'password123',
            role: index_js_1.Role.CIVIL,
            address: 'Rua das Flores, 123, Centro, Palhoça - SC',
            phone: '(48) 99999-8888',
        };
        const parsed = auth_dto_js_1.registerSchema.safeParse(validCivil);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve aceitar solicitação de recuperação de senha com e-mail válido', () => {
        const parsed = auth_dto_js_1.forgotPasswordSchema.safeParse({ email: 'usuario@coper.edu.br' });
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve rejeitar redefinição de senha com senha curta', () => {
        const parsed = auth_dto_js_1.resetPasswordSchema.safeParse({
            token: 'some-token',
            password: '123',
        });
        (0, vitest_1.expect)(parsed.success).toBe(false);
    });
});
(0, vitest_1.describe)('Sistema COPER 3.0 - Regras de Negócio de Doações e Relatórios', () => {
    (0, vitest_1.it)('deve exigir motivo da rejeição ao rejeitar uma doação', () => {
        const invalidRejection = {
            status: index_js_1.DonationStatus.REJECTED,
            hoursEarned: 0,
            rejectionReason: '',
        };
        const parsed = donation_dto_js_1.validateDonationSchema.safeParse(invalidRejection);
        (0, vitest_1.expect)(parsed.success).toBe(false);
    });
    (0, vitest_1.it)('deve aceitar aprovação de doação com horas informadas', () => {
        const validApproval = {
            status: index_js_1.DonationStatus.APPROVED,
            hoursEarned: 10,
            observation: 'Itens em excelente estado',
        };
        const parsed = donation_dto_js_1.validateDonationSchema.safeParse(validApproval);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve aceitar criação de doação com múltiplos itens e campanha associada', () => {
        const donation = {
            campaignId: 'c0a80123-0000-0000-0000-000000000101',
            items: [
                { description: 'Casacos de lã', category: 'ROUPAS', quantity: 3, unit: 'peças' },
                { description: 'Arroz 5kg', category: 'ALIMENTOS', quantity: 2, unit: 'pacotes' },
            ],
            observation: 'Entregue no balcão COPER',
        };
        const parsed = donation_dto_js_1.createDonationSchema.safeParse(donation);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve validar parâmetros de paginação e filtros do relatório consolidado', () => {
        const filter = {
            page: 1,
            limit: 50,
            status: 'APPROVED',
            startDate: '2026-01-01',
            endDate: '2026-06-01',
        };
        const parsed = donation_dto_js_1.reportFilterSchema.safeParse(filter);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
});
(0, vitest_1.describe)('Sistema COPER 3.0 - Módulo Acadêmico de Cursos e Avaliações', () => {
    (0, vitest_1.it)('deve validar criação de turma com janela de inscrição e média mínima', async () => {
        const { createClassroomSchema } = await import('../../dtos/course.dto.js');
        const classroomData = {
            courseId: 'c0a80123-0000-0000-0000-000000000001',
            code: 'LIBRAS-2026.1-NOTURNO',
            maxCapacity: 25,
            startDate: '2026-03-01T19:00:00Z',
            endDate: '2026-06-30T22:00:00Z',
            enrollmentStartDate: '2026-02-01T08:00:00Z',
            enrollmentEndDate: '2026-02-28T23:59:59Z',
            cancellationDeadline: '2026-03-15T23:59:59Z',
            minGrade: 7.0,
        };
        const parsed = createClassroomSchema.safeParse(classroomData);
        (0, vitest_1.expect)(parsed.success).toBe(true);
        if (parsed.success) {
            (0, vitest_1.expect)(parsed.data.minGrade).toBe(7.0);
            (0, vitest_1.expect)(parsed.data.maxCapacity).toBe(25);
        }
    });
    (0, vitest_1.it)('deve validar lançamento de avaliações A1, A2 e A3', async () => {
        const { launchClassroomGradesSchema } = await import('../../dtos/course.dto.js');
        const gradesData = {
            grades: [
                {
                    enrollmentId: 'c0a80123-0000-0000-0000-000000000011',
                    gradeA1: 8.5,
                    gradeA2: 7.0,
                    gradeA3: 9.0,
                },
                {
                    enrollmentId: 'c0a80123-0000-0000-0000-000000000012',
                    gradeA1: 6.0,
                    gradeA2: 5.5,
                    gradeA3: 6.5,
                },
            ],
        };
        const parsed = launchClassroomGradesSchema.safeParse(gradesData);
        (0, vitest_1.expect)(parsed.success).toBe(true);
    });
    (0, vitest_1.it)('deve rejeitar notas fora do intervalo 0 a 10', async () => {
        const { launchClassroomGradesSchema } = await import('../../dtos/course.dto.js');
        const invalidGrades = {
            grades: [
                {
                    enrollmentId: 'c0a80123-0000-0000-0000-000000000011',
                    gradeA1: 11.5,
                },
            ],
        };
        const parsed = launchClassroomGradesSchema.safeParse(invalidGrades);
        (0, vitest_1.expect)(parsed.success).toBe(false);
    });
    (0, vitest_1.describe)('Validação de Campanhas e Período (data_inicio e data_limite)', () => {
        (0, vitest_1.it)('deve calcular status FUTURA se a data de início for posterior ao momento atual', async () => {
            const { computeCampaignStatus } = await import('../../../presentation/routes/campaignRoutes.js');
            const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const futureEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const status = computeCampaignStatus(futureStart, futureEnd);
            (0, vitest_1.expect)(status).toBe('FUTURE');
        });
        (0, vitest_1.it)('deve calcular status ATIVA se a data atual estiver dentro do intervalo', async () => {
            const { computeCampaignStatus } = await import('../../../presentation/routes/campaignRoutes.js');
            const pastStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const futureEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            const status = computeCampaignStatus(pastStart, futureEnd);
            (0, vitest_1.expect)(status).toBe('ACTIVE');
        });
        (0, vitest_1.it)('deve calcular status ENCERRADA (CLOSED) se a data limite for anterior à data atual', async () => {
            const { computeCampaignStatus } = await import('../../../presentation/routes/campaignRoutes.js');
            const pastStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const pastEnd = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            const status = computeCampaignStatus(pastStart, pastEnd);
            (0, vitest_1.expect)(status).toBe('CLOSED');
        });
        (0, vitest_1.it)('deve manter status CLOSED se a campanha foi encerrada manualmente', async () => {
            const { computeCampaignStatus } = await import('../../../presentation/routes/campaignRoutes.js');
            const pastStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const futureEnd = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
            const status = computeCampaignStatus(pastStart, futureEnd, 'CLOSED');
            (0, vitest_1.expect)(status).toBe('CLOSED');
        });
    });
});
