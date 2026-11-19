import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../dtos/auth.dto.js';
import {
  validateDonationSchema,
  createDonationSchema,
  reportFilterSchema,
} from '../../dtos/donation.dto.js';
import { Role, DonationStatus } from '../../../domain/enums/index.js';

describe('Sistema COPER 3.0 - Validação de Perfis e RBAC', () => {
  it('deve aceitar cadastro de ALUNO com e-mail institucional e matrícula válida', () => {
    const validAluno = {
      name: 'João da Silva',
      email: 'joao.silva@aluno.fmpsc.edu.br',
      cpf: '123.456.789-00',
      password: 'password123',
      role: Role.ALUNO,
      matricula: '20261010',
    };

    const parsed = registerSchema.safeParse(validAluno);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cpf).toBe('12345678900');
    }
  });

  it('deve rejeitar cadastro de ALUNO sem matrícula', () => {
    const invalidAluno = {
      name: 'João da Silva',
      email: 'joao.silva@aluno.fmpsc.edu.br',
      cpf: '123.456.789-00',
      password: 'password123',
      role: Role.ALUNO,
    };

    const parsed = registerSchema.safeParse(invalidAluno);
    expect(parsed.success).toBe(false);
  });

  it('deve rejeitar cadastro de ALUNO com e-mail não institucional (ex: gmail)', () => {
    const invalidAluno = {
      name: 'João da Silva',
      email: 'joao.silva@gmail.com',
      cpf: '123.456.789-00',
      password: 'password123',
      role: Role.ALUNO,
      matricula: '20261010',
    };

    const parsed = registerSchema.safeParse(invalidAluno);
    expect(parsed.success).toBe(false);
  });

  it('deve aceitar cadastro de PROFESSOR com e-mail @fmpsc.edu.br', () => {
    const validProf = {
      name: 'Prof. Carlos',
      email: 'carlos@fmpsc.edu.br',
      cpf: '123.456.789-11',
      password: 'password123',
      role: Role.PROFESSOR,
    };

    const parsed = registerSchema.safeParse(validProf);
    expect(parsed.success).toBe(true);
  });

  it('deve aceitar cadastro de CIVIL com e-mail pessoal e endereço residencial', () => {
    const validCivil = {
      name: 'Maria de Lourdes',
      email: 'maria.lourdes@gmail.com',
      cpf: '987.654.321-00',
      password: 'password123',
      role: Role.CIVIL,
      address: 'Rua das Flores, 123, Centro, Palhoça - SC',
      phone: '(48) 99999-8888',
    };

    const parsed = registerSchema.safeParse(validCivil);
    expect(parsed.success).toBe(true);
  });

  it('deve aceitar solicitação de recuperação de senha com e-mail válido', () => {
    const parsed = forgotPasswordSchema.safeParse({ email: 'usuario@coper.edu.br' });
    expect(parsed.success).toBe(true);
  });

  it('deve rejeitar redefinição de senha com senha curta', () => {
    const parsed = resetPasswordSchema.safeParse({
      token: 'some-token',
      password: '123', // menos de 6 caracteres
    });
    expect(parsed.success).toBe(false);
  });
});

describe('Sistema COPER 3.0 - Regras de Negócio de Doações e Relatórios', () => {
  it('deve exigir motivo da rejeição ao rejeitar uma doação', () => {
    const invalidRejection = {
      status: DonationStatus.REJECTED,
      hoursEarned: 0,
      rejectionReason: '',
    };

    const parsed = validateDonationSchema.safeParse(invalidRejection);
    expect(parsed.success).toBe(false);
  });

  it('deve aceitar aprovação de doação com horas informadas', () => {
    const validApproval = {
      status: DonationStatus.APPROVED,
      hoursEarned: 10,
      observation: 'Itens em excelente estado',
    };

    const parsed = validateDonationSchema.safeParse(validApproval);
    expect(parsed.success).toBe(true);
  });

  it('deve aceitar criação de doação com múltiplos itens e campanha associada', () => {
    const donation = {
      campaignId: 'c0a80123-0000-0000-0000-000000000101',
      items: [
        { description: 'Casacos de lã', category: 'ROUPAS', quantity: 3, unit: 'peças' },
        { description: 'Arroz 5kg', category: 'ALIMENTOS', quantity: 2, unit: 'pacotes' },
      ],
      observation: 'Entregue no balcão COPER',
    };

    const parsed = createDonationSchema.safeParse(donation);
    expect(parsed.success).toBe(true);
  });

  it('deve validar parâmetros de paginação e filtros do relatório consolidado', () => {
    const filter = {
      page: 1,
      limit: 50,
      status: 'APPROVED',
      startDate: '2026-01-01',
      endDate: '2026-06-01',
    };

    const parsed = reportFilterSchema.safeParse(filter);
    expect(parsed.success).toBe(true);
  });
});

describe('Sistema COPER 3.0 - Módulo Acadêmico de Cursos e Avaliações', () => {
  it('deve validar criação de turma com janela de inscrição e média mínima', async () => {
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
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minGrade).toBe(7.0);
      expect(parsed.data.maxCapacity).toBe(25);
    }
  });

  it('deve validar lançamento de avaliações A1, A2 e A3', async () => {
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
    expect(parsed.success).toBe(true);
  });

  it('deve rejeitar notas fora do intervalo 0 a 10', async () => {
    const { launchClassroomGradesSchema } = await import('../../dtos/course.dto.js');
    const invalidGrades = {
      grades: [
        {
          enrollmentId: 'c0a80123-0000-0000-0000-000000000011',
          gradeA1: 11.5, // Inválido > 10
        },
      ],
    };

    const parsed = launchClassroomGradesSchema.safeParse(invalidGrades);
    expect(parsed.success).toBe(false);
  });
});

