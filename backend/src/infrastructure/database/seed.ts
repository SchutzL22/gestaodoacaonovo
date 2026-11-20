import { prisma } from './prisma.js';
import { PasswordHasher } from '../security/PasswordHasher.js';
import {
  UserRole,
  CourseStatus,
  EnrollmentStatus,
  DonationStatus,
  DocType,
  CampaignStatus,
} from '../../domain/enums/index.js';

// ===========================================================================
// SEED DEMO — Sistema COPER 3.0 — FMP (Versão Banca PI III 2026)
// Idempotente: pode ser executado múltiplas vezes sem duplicar registros.
// ===========================================================================

export async function seed() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   [Seed] Sistema COPER 3.0 — FMP — Banca PI III 2026        ║');
  console.log('║   Iniciando povoamento completo com dados realistas...       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // 0. PRÉ-LIMPEZA — Remove registros do seed legado (emails antigos)
  //    Garante idempotência mesmo quando o banco já tem dados anteriores.
  // ─────────────────────────────────────────────────────────────────────────
  const legacyEmails = [
    'coper@coper.edu.br',
    'admin@fmpsc.edu.br',
    'professor.libras@coper.edu.br',
    'professor.ti@coper.edu.br',
    'lucas.aluno@aluno.coper.edu.br',
    'lucas@aluno.fmpsc.edu.br',
    'mariana.aluna@aluno.coper.edu.br',
    'gabriel.costa@aluno.coper.edu.br',
    'beatriz.lima@aluno.coper.edu.br',
    'matheus.duarte@aluno.coper.edu.br',
    'contato@techparceira.com.br',
    'comunidade.palhoca@gmail.com',
  ];

  // Excluir em cascata (donations, enrollments, certificates vinculados)
  const legacyUsers = await prisma.user.findMany({
    where: { email: { in: legacyEmails } },
    select: { id: true, email: true },
  });

  if (legacyUsers.length > 0) {
    const legacyIds = legacyUsers.map((u) => u.id);
    console.log(`[Seed] 🧹 Limpando ${legacyUsers.length} usuário(s) legado(s): ${legacyUsers.map((u) => u.email).join(', ')}`);
    // Ordem importa por causa das FK — precisamos limpar toda a hierarquia:
    // attendances → grades → enrollments → classrooms → courses
    // certificates → donation_items → donations
    // users (instructor FK em courses)

    // 1. Certificados vinculados a esses usuários
    await prisma.certificate.deleteMany({ where: { userId: { in: legacyIds } } });

    // 2. Doações (e itens em cascade) vinculadas a esses usuários
    await prisma.donation.deleteMany({ where: { userId: { in: legacyIds } } });

    // 3. Matrículas desses usuários (como alunos)
    await prisma.enrollment.deleteMany({ where: { studentId: { in: legacyIds } } });

    // 4. Cursos onde esses usuários são instrutores (e turmas/matrículas em cascade)
    const legacyCoursesIds = (
      await prisma.course.findMany({
        where: { instructorId: { in: legacyIds } },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (legacyCoursesIds.length > 0) {
      const legacyClassroomIds = (
        await prisma.classroom.findMany({
          where: { courseId: { in: legacyCoursesIds } },
          select: { id: true },
        })
      ).map((cl) => cl.id);

      if (legacyClassroomIds.length > 0) {
        await prisma.enrollment.deleteMany({ where: { classroomId: { in: legacyClassroomIds } } });
      }
      await prisma.classroom.deleteMany({ where: { courseId: { in: legacyCoursesIds } } });
      await prisma.course.deleteMany({ where: { id: { in: legacyCoursesIds } } });
    }

    // 5. Agora podemos deletar os usuários com segurança
    await prisma.user.deleteMany({ where: { id: { in: legacyIds } } });
    console.log('[Seed] ✅ Limpeza de dados legados concluída.');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. SENHAS CRIPTOGRAFADAS
  // ─────────────────────────────────────────────────────────────────────────
  const coperPassword   = await PasswordHasher.hash('Coper@2026');
  const profPassword    = await PasswordHasher.hash('Prof@2026');
  const alunoPassword   = await PasswordHasher.hash('Aluno@2026');
  const empresaPassword = await PasswordHasher.hash('Empresa@2026');
  const civilPassword   = await PasswordHasher.hash('Civil@2026');

  // ─────────────────────────────────────────────────────────────────────────
  // 2. USUÁRIOS
  // ─────────────────────────────────────────────────────────────────────────

  // COPER / Admin
  const admin = await prisma.user.upsert({
    where: { email: 'coper@fmpsc.edu.br' },
    update: { name: 'Coordenação COPER FMP', isActive: true },
    create: {
      name: 'Coordenação COPER FMP',
      email: 'coper@fmpsc.edu.br',
      cpf: '00011122233',
      passwordHash: coperPassword,
      role: UserRole.COPER,
      phone: '(48) 3279-0000',
      isActive: true,
    },
  });

  // Professor Libras
  const professorLibras = await prisma.user.upsert({
    where: { email: 'prof.libras@fmpsc.edu.br' },
    update: { name: 'Prof. Rafael Santos (Libras)', isActive: true },
    create: {
      name: 'Prof. Rafael Santos (Libras)',
      email: 'prof.libras@fmpsc.edu.br',
      cpf: '11122233344',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
      phone: '(48) 99111-2233',
      isActive: true,
    },
  });

  // Professor Extensão
  const professorExtensao = await prisma.user.upsert({
    where: { email: 'prof.extensao@fmpsc.edu.br' },
    update: { name: 'Profª. Daniela Amorim (Extensão)', isActive: true },
    create: {
      name: 'Profª. Daniela Amorim (Extensão)',
      email: 'prof.extensao@fmpsc.edu.br',
      cpf: '11122233355',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
      phone: '(48) 99111-4455',
      isActive: true,
    },
  });

  // Aluno 1 — Lucas Schutz (ATIVO)
  const alunoLucas = await prisma.user.upsert({
    where: { email: 'lucas.schutz@aluno.fmpsc.edu.br' },
    update: { matricula: '20241001', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 25 },
    create: {
      name: 'Lucas Alexandre Vieira Schutz',
      email: 'lucas.schutz@aluno.fmpsc.edu.br',
      cpf: '22233344455',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241001',
      phone: '(48) 99222-3344',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 25,
    },
  });

  // Aluno 2 — Eduardo Silva (ATIVO)
  const alunoEduardo = await prisma.user.upsert({
    where: { email: 'eduardo.silva@aluno.fmpsc.edu.br' },
    update: { matricula: '20241002', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 15 },
    create: {
      name: 'Eduardo da Silva',
      email: 'eduardo.silva@aluno.fmpsc.edu.br',
      cpf: '33344455566',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241002',
      phone: '(48) 99333-4455',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 15,
    },
  });

  // Aluno 3 — Davi Aravechia (ATIVO)
  const alunoDavi = await prisma.user.upsert({
    where: { email: 'davi.aravechia@aluno.fmpsc.edu.br' },
    update: { matricula: '20241003', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 10 },
    create: {
      name: 'Davi Aravechia',
      email: 'davi.aravechia@aluno.fmpsc.edu.br',
      cpf: '44455566677',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241003',
      phone: '(48) 99444-5566',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 10,
    },
  });

  // Aluno 4 — Vitor Emanuel (ATIVO)
  const alunoVitor = await prisma.user.upsert({
    where: { email: 'vitor.emanuel@aluno.fmpsc.edu.br' },
    update: { matricula: '20241004', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 0 },
    create: {
      name: 'Vitor Emanuel',
      email: 'vitor.emanuel@aluno.fmpsc.edu.br',
      cpf: '55566677788',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241004',
      phone: '(48) 99555-6677',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  // Aluno 5 — Nicolas (ATIVO)
  const alunoNicolas = await prisma.user.upsert({
    where: { email: 'nicolas@aluno.fmpsc.edu.br' },
    update: { matricula: '20241005', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 0 },
    create: {
      name: 'Nicolas',
      email: 'nicolas@aluno.fmpsc.edu.br',
      cpf: '66677788899',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241005',
      phone: '(48) 99666-7788',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  // Aluna 6 — Ana Souza (ATIVA)
  const alunaAna = await prisma.user.upsert({
    where: { email: 'ana.souza@aluno.fmpsc.edu.br' },
    update: { matricula: '20241006', isActive: true, semesterHoursLimit: 40, totalHoursEarned: 0 },
    create: {
      name: 'Ana Souza',
      email: 'ana.souza@aluno.fmpsc.edu.br',
      cpf: '77788899900',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241006',
      phone: '(48) 99777-8899',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  // Aluno 7 — INATIVO (testa bloqueio RN05)
  await prisma.user.upsert({
    where: { email: 'aluno.inativo@aluno.fmpsc.edu.br' },
    update: { matricula: '20241007', isActive: false },
    create: {
      name: 'Aluno Inativo (Teste RN05)',
      email: 'aluno.inativo@aluno.fmpsc.edu.br',
      cpf: '88899900011',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20241007',
      phone: '(48) 99888-7766',
      isActive: false,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  // Empresário
  const empresario = await prisma.user.upsert({
    where: { email: 'parceiro@empresa.com.br' },
    update: { isActive: true },
    create: {
      name: 'Empresa Parceira S/A — Responsabilidade Social',
      email: 'parceiro@empresa.com.br',
      cpf: '99900011122',
      passwordHash: empresaPassword,
      role: UserRole.EMPRESARIO,
      phone: '(48) 3344-5500',
      address: 'Rodovia SC-401, Km 4, Saco Grande, Florianópolis - SC',
      isActive: true,
    },
  });

  // Civil cadastrado
  const civil = await prisma.user.upsert({
    where: { email: 'civil@gmail.com' },
    update: { isActive: true },
    create: {
      name: 'Maria de Lourdes (Comunidade Palhoça)',
      email: 'civil@gmail.com',
      cpf: '12312312300',
      passwordHash: civilPassword,
      role: UserRole.CIVIL,
      phone: '(48) 99888-7766',
      address: 'Rua das Flores, 120, Centro, Palhoça - SC',
      isActive: true,
    },
  });

  console.log('[Seed] ✅ 12 usuários configurados (COPER, 2 Professores, 6 Alunos ativos, 1 Inativo, Empresário, Civil)');

  // ─────────────────────────────────────────────────────────────────────────
  // 3. CAMPANHAS E ITENS PRIORITÁRIOS
  // ─────────────────────────────────────────────────────────────────────────

  // Campanha 1 — ATIVA: Agasalho + Alimentos (campanha principal da banca)
  const campaignAtiva = await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000101' },
    update: {
      title: 'Campanha do Agasalho e Alimentos FMP 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-11-30'),
      status: CampaignStatus.ACTIVE,
      isUrgent: true,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000101',
      title: 'Campanha do Agasalho e Alimentos FMP 2026',
      description: 'Arrecadação solidária de roupas de inverno, cobertores e alimentos não perecíveis para famílias em situação de vulnerabilidade social no município de Palhoça-SC.',
      status: CampaignStatus.ACTIVE,
      isUrgent: true,
      hoursLimit: 30,
      conversionRules: '1 agasalho/cobertor = 2.5h | 5kg alimentos = 5h | máx. 30h por semestre',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-11-30'),
      priorityItems: {
        create: [
          { name: 'Cobertores Térmicos', goal: 100, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Arroz Tipo 1 (5kg)', goal: 200, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Feijão Preto (1kg)', goal: 150, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Casacos e Jaquetas Infantis', goal: 80, urgencyLevel: 'MEDIA', isUrgent: false },
        ],
      },
    },
  });

  // Campanha 2 — ENCERRADA: Páscoa (para testar bloqueio de doações)
  const campaignEncerrada = await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000102' },
    update: {
      title: 'Campanha de Páscoa FMP 2026',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-21'),
      status: CampaignStatus.CLOSED,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000102',
      title: 'Campanha de Páscoa FMP 2026',
      description: 'Doação de ovos de Páscoa e cestas para crianças atendidas pelas entidades parceiras da FMP.',
      status: CampaignStatus.CLOSED,
      isUrgent: false,
      hoursLimit: 10,
      conversionRules: '1 cesta = 5h complementares | máx. 10h',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-04-21'),
      priorityItems: {
        create: [
          { name: 'Ovos de Páscoa (médio)', goal: 60, urgencyLevel: 'NORMAL', isUrgent: false },
        ],
      },
    },
  });

  // Campanha 3 — FUTURA: Natal Solidário (para testar bloqueio de doações futuras)
  await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000103' },
    update: {
      title: 'Natal Solidário FMP 2026',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-31'),
      status: CampaignStatus.FUTURE,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000103',
      title: 'Natal Solidário FMP 2026',
      description: 'Campanha de arrecadação de brinquedos novos e usados em bom estado, além de cestas natalinas para famílias em situação de vulnerabilidade.',
      status: CampaignStatus.FUTURE,
      isUrgent: false,
      hoursLimit: 15,
      conversionRules: '1 brinquedo = 2h | 1 cesta natalina = 5h | máx. 15h',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-31'),
      priorityItems: {
        create: [
          { name: 'Brinquedos Novos (0-12 anos)', goal: 120, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Cestas Natalinas', goal: 50, urgencyLevel: 'MEDIA', isUrgent: false },
        ],
      },
    },
  });

  // Campanha 4 — ENCERRADA: Brinquedos Natal 2025 (histórico)
  await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000104' },
    update: {
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-12-25'),
      status: CampaignStatus.CLOSED,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000104',
      title: 'Campanha de Brinquedos e Natal Solidário 2025',
      description: 'Arrecadação de brinquedos novos e usados para crianças de entidades assistidas.',
      status: CampaignStatus.CLOSED,
      isUrgent: false,
      hoursLimit: 10,
      conversionRules: '1 brinquedo = 2 horas complementares',
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-12-25'),
    },
  });

  console.log('[Seed] ✅ 4 campanhas configuradas (1 ATIVA, 1 FUTURA, 2 ENCERRADAS)');

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CURSOS EXTRACURRICULARES
  // ─────────────────────────────────────────────────────────────────────────

  const cursoLibras = await prisma.course.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000001' },
    update: {
      title: 'Libras Básico — Extensão FMP',
      instructorId: professorLibras.id,
      status: CourseStatus.OPEN,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000001',
      title: 'Libras Básico — Extensão FMP',
      description: 'Introdução à Língua Brasileira de Sinais com foco em comunicação básica, identidade surda e acessibilidade. Curso de extensão reconhecido pela COPER-FMP.',
      instructorId: professorLibras.id,
      workloadHours: 40,
      minAttendancePct: 75.0,
      status: CourseStatus.OPEN,
    },
  });

  const cursoExtensao = await prisma.course.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000002' },
    update: {
      title: 'Empreendedorismo Social e Responsabilidade — FMP',
      instructorId: professorExtensao.id,
      status: CourseStatus.OPEN,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000002',
      title: 'Empreendedorismo Social e Responsabilidade — FMP',
      description: 'Fundamentos de empreendedorismo social, ESG, impacto socioambiental e responsabilidade corporativa aplicados ao contexto regional de Palhoça-SC.',
      instructorId: professorExtensao.id,
      workloadHours: 30,
      minAttendancePct: 75.0,
      status: CourseStatus.OPEN,
    },
  });

  console.log('[Seed] ✅ 2 cursos configurados (Libras, Empreendedorismo Social)');

  // ─────────────────────────────────────────────────────────────────────────
  // 5. TURMAS — Libras LOTADA (4/4) + 2 na Fila de Espera
  // ─────────────────────────────────────────────────────────────────────────

  const hoje = new Date();
  const classStartDate = new Date(hoje); classStartDate.setDate(hoje.getDate() - 30);
  const classEndDate   = new Date(hoje); classEndDate.setDate(hoje.getDate() + 30);
  const enrollStart    = new Date(hoje); enrollStart.setDate(hoje.getDate() - 10);
  const enrollEnd      = new Date(hoje); enrollEnd.setDate(hoje.getDate() + 5);
  const cancelDeadline = new Date(hoje); cancelDeadline.setDate(hoje.getDate() + 10);

  const turmaLibras = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000011' },
    update: {
      maxCapacity: 4,
      minGrade: 7.0,
      enrollmentStartDate: enrollStart,
      enrollmentEndDate: enrollEnd,
      cancellationDeadline: cancelDeadline,
      status: CourseStatus.IN_PROGRESS,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000011',
      courseId: cursoLibras.id,
      code: 'LIBRAS-2026.1-NOTURNO',
      maxCapacity: 4,
      startDate: classStartDate,
      endDate: classEndDate,
      enrollmentStartDate: enrollStart,
      enrollmentEndDate: enrollEnd,
      cancellationDeadline: cancelDeadline,
      minGrade: 7.0,
      status: CourseStatus.IN_PROGRESS,
    },
  });

  // Turma secundária — Empreendedorismo (aberta para inscrições)
  const turmaExtensao = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000012' },
    update: {
      minGrade: 6.0,
      enrollmentStartDate: enrollStart,
      enrollmentEndDate: enrollEnd,
      cancellationDeadline: cancelDeadline,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000012',
      courseId: cursoExtensao.id,
      code: 'EMP-SOCIAL-2026.1-MATUTINO',
      maxCapacity: 25,
      startDate: classStartDate,
      endDate: classEndDate,
      enrollmentStartDate: enrollStart,
      enrollmentEndDate: enrollEnd,
      cancellationDeadline: cancelDeadline,
      minGrade: 6.0,
      status: CourseStatus.OPEN,
    },
  });

  console.log('[Seed] ✅ 2 turmas configuradas (Libras IN_PROGRESS, Empreendedorismo OPEN)');

  // ─────────────────────────────────────────────────────────────────────────
  // 6. MATRÍCULAS — Libras: 4 ATIVAS + 2 FILA DE ESPERA
  // ─────────────────────────────────────────────────────────────────────────

  // Lucas — ACTIVE, notas boas (aprovado)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunoLucas.id } },
    update: { gradeA1: 8.5, gradeA2: 9.0, gradeA3: 8.0, finalGrade: 8.5, attendancePercentage: 92.0 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunoLucas.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 8.5,
      gradeA2: 9.0,
      gradeA3: 8.0,
      finalGrade: 8.5,
      attendancePercentage: 92.0,
    },
  });

  // Eduardo — ACTIVE, notas medianas (aprovado)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunoEduardo.id } },
    update: { gradeA1: 7.0, gradeA2: 7.5, gradeA3: 8.0, finalGrade: 7.5, attendancePercentage: 85.0 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunoEduardo.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 7.0,
      gradeA2: 7.5,
      gradeA3: 8.0,
      finalGrade: 7.5,
      attendancePercentage: 85.0,
    },
  });

  // Davi — ACTIVE, notas excelentes (aprovado com distinção)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunoDavi.id } },
    update: { gradeA1: 9.0, gradeA2: 8.5, gradeA3: 9.5, finalGrade: 9.0, attendancePercentage: 95.0 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunoDavi.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 9.0,
      gradeA2: 8.5,
      gradeA3: 9.5,
      finalGrade: 9.0,
      attendancePercentage: 95.0,
    },
  });

  // Ana — ACTIVE, frequência e média baixas (reprovada — demo de RN)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunaAna.id } },
    update: { gradeA1: 6.0, gradeA2: 7.0, gradeA3: 6.5, finalGrade: 6.5, attendancePercentage: 70.0 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunaAna.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 6.0,
      gradeA2: 7.0,
      gradeA3: 6.5,
      finalGrade: 6.5,
      attendancePercentage: 70.0,
    },
  });

  // Vitor — WAITLIST posição 1 (demo promoção automática)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunoVitor.id } },
    update: { status: EnrollmentStatus.WAITLIST, waitlistPosition: 1 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunoVitor.id,
      status: EnrollmentStatus.WAITLIST,
      waitlistPosition: 1,
    },
  });

  // Nicolas — WAITLIST posição 2
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: alunoNicolas.id } },
    update: { status: EnrollmentStatus.WAITLIST, waitlistPosition: 2 },
    create: {
      classroomId: turmaLibras.id,
      studentId: alunoNicolas.id,
      status: EnrollmentStatus.WAITLIST,
      waitlistPosition: 2,
    },
  });

  // Eduardo — também na turma de Empreendedorismo
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaExtensao.id, studentId: alunoEduardo.id } },
    update: {},
    create: {
      classroomId: turmaExtensao.id,
      studentId: alunoEduardo.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  console.log('[Seed] ✅ Matrículas: 4 ATIVAS (Lucas, Eduardo, Davi, Ana) + 2 WAITLIST (Vitor #1, Nicolas #2)');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. DOAÇÕES (hashes fixos para demo)
  // ─────────────────────────────────────────────────────────────────────────

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // ── D1 — APROVADA: Lucas → Agasalho ATIVA (10h complementares) ─────────
  const d1Hash = 'fmp-d001-lucas-agasalho-2026';
  const donation1 = await prisma.donation.upsert({
    where: { authHash: d1Hash },
    update: {},
    create: {
      userId: alunoLucas.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      receivedById: admin.id,
      campaignId: campaignAtiva.id,
      hoursEarned: 10,
      authHash: d1Hash,
      observation: 'Cobertores e agasalhos conferidos no balcão COPER. Itens em ótimo estado.',
      items: {
        create: [
          { description: 'Cobertores Térmicos', category: 'ROUPAS', quantity: 4, unit: 'unidades' },
          { description: 'Casacos de Inverno', category: 'ROUPAS', quantity: 2, unit: 'unidades' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d1Hash },
    update: {},
    create: {
      userId: alunoLucas.id,
      donationId: donation1.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d1Hash,
      validationUrl: `${frontendUrl}/validar?code=${d1Hash}`,
      title: 'Declaração de Doação Social — Campanha do Agasalho FMP 2026',
      hours: 10,
      metadata: { items: '4x Cobertores Térmicos, 2x Casacos de Inverno', validator: admin.name, aluno: alunoLucas.name, matricula: '20241001' },
    },
  });

  // ── D2 — APROVADA: Eduardo → Alimentos ATIVA (15h complementares) ──────
  const d2Hash = 'fmp-d002-eduardo-alimentos-2026';
  const donation2 = await prisma.donation.upsert({
    where: { authHash: d2Hash },
    update: {},
    create: {
      userId: alunoEduardo.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      receivedById: admin.id,
      campaignId: campaignAtiva.id,
      hoursEarned: 15,
      authHash: d2Hash,
      observation: 'Alimentos conferidos e aceitos. Dentro do prazo de validade.',
      items: {
        create: [
          { description: 'Arroz Tipo 1 (5kg)', category: 'ALIMENTOS', quantity: 3, unit: 'pacotes' },
          { description: 'Feijão Preto (1kg)', category: 'ALIMENTOS', quantity: 6, unit: 'pacotes' },
          { description: 'Leite em Pó Integral', category: 'ALIMENTOS', quantity: 2, unit: 'latas' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d2Hash },
    update: {},
    create: {
      userId: alunoEduardo.id,
      donationId: donation2.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d2Hash,
      validationUrl: `${frontendUrl}/validar?code=${d2Hash}`,
      title: 'Declaração de Doação Social — Alimentos FMP 2026',
      hours: 15,
      metadata: { items: '3x Arroz 5kg, 6x Feijão 1kg, 2x Leite em Pó', validator: admin.name, aluno: alunoEduardo.name, matricula: '20241002' },
    },
  });

  // ── D3 — APROVADA: Civil (Dona Maria) → Campanha Encerrada Páscoa (0h) ─
  const d3Hash = 'fmp-d003-civil-pascoa-2026';
  const donation3 = await prisma.donation.upsert({
    where: { authHash: d3Hash },
    update: {},
    create: {
      userId: civil.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      receivedById: admin.id,
      campaignId: campaignEncerrada.id,
      hoursEarned: 0,
      authHash: d3Hash,
      donorName: civil.name,
      donorCpf: '12312312300',
      observation: 'Doação de moradora da comunidade de Palhoça. Cestas entregues na FMP.',
      items: {
        create: [
          { description: 'Ovos de Páscoa Artesanais', category: 'ALIMENTOS', quantity: 5, unit: 'unidades' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d3Hash },
    update: {},
    create: {
      userId: civil.id,
      donationId: donation3.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d3Hash,
      validationUrl: `${frontendUrl}/validar?code=${d3Hash}`,
      title: 'Comprovante de Doação — Campanha de Páscoa FMP 2026',
      hours: 0,
      metadata: { items: '5x Ovos de Páscoa Artesanais', validator: admin.name, doador: civil.name },
    },
  });

  // ── D4 — APROVADA: Empresa Parceira → Responsabilidade Social (0h) ─────
  const d4Hash = 'fmp-d004-empresa-responsabilidade-2026';
  const donation4 = await prisma.donation.upsert({
    where: { authHash: d4Hash },
    update: {},
    create: {
      userId: empresario.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      receivedById: admin.id,
      campaignId: campaignAtiva.id,
      hoursEarned: 0,
      authHash: d4Hash,
      observation: 'Doação corporativa de responsabilidade social — entregue na sede FMP com nota fiscal.',
      items: {
        create: [
          { description: 'Kits de Higiene Pessoal', category: 'HIGIENE', quantity: 50, unit: 'kits' },
          { description: 'Cobertores Industriais', category: 'ROUPAS', quantity: 20, unit: 'unidades' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d4Hash },
    update: {},
    create: {
      userId: empresario.id,
      donationId: donation4.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d4Hash,
      validationUrl: `${frontendUrl}/validar?code=${d4Hash}`,
      title: 'Comprovante Institucional de Responsabilidade Social Empresarial — FMP 2026',
      hours: 0,
      metadata: { items: '50x Kits Higiene, 20x Cobertores', validator: admin.name, empresa: empresario.name },
    },
  });

  // ── D5 — PENDENTE: Vitor → Livros (sem campanha, aguardando análise) ───
  const d5Hash = 'fmp-d005-vitor-pendente-2026';
  await prisma.donation.upsert({
    where: { authHash: d5Hash },
    update: {},
    create: {
      userId: alunoVitor.id,
      status: DonationStatus.PENDING,
      receivedById: admin.id,
      hoursEarned: 0,
      authHash: d5Hash,
      observation: 'Aguardando conferência física dos livros na recepção COPER.',
      items: {
        create: [
          { description: 'Livros Didáticos Ensino Médio', category: 'LIVROS', quantity: 8, unit: 'exemplares' },
          { description: 'Livros de Literatura Brasileira', category: 'LIVROS', quantity: 4, unit: 'exemplares' },
        ],
      },
    },
  });

  // ── D6 — PENDENTE: Doação registrada no balcão por um visitante sem cadastro.
  //   userId é obrigatório no schema; usamos o admin como operador que registrou
  //   e donorName/donorCpf identificam o doador físico não cadastrado.
  const d6Hash = 'fmp-d006-anonimo-balcao-2026';
  await prisma.donation.upsert({
    where: { authHash: d6Hash },
    update: {},
    create: {
      userId: admin.id,
      status: DonationStatus.PENDING,
      receivedById: admin.id,
      hoursEarned: 0,
      authHash: d6Hash,
      donorName: 'João da Silva Pereira',
      donorCpf: '98765432100',
      observation: 'Visitante não cadastrado entregou itens no balcão COPER. Registrado pelo operador.',
      items: {
        create: [
          { description: 'Roupas Infantis Diversas', category: 'ROUPAS', quantity: 15, unit: 'peças' },
        ],
      },
    },
  });

  console.log('[Seed] ✅ 6 doações criadas (4 APROVADAS + 2 PENDENTES)');

  // ─────────────────────────────────────────────────────────────────────────
  // 8. CERTIFICADOS AMIGÁVEIS PARA DEMO RÁPIDA
  // ─────────────────────────────────────────────────────────────────────────

  // Certificado de curso — Lucas (Libras) com código curto
  await prisma.certificate.upsert({
    where: { authHash: 'tok-lucas-libras' },
    update: {},
    create: {
      userId: alunoLucas.id,
      type: DocType.COURSE_CERTIFICATE,
      authHash: 'tok-lucas-libras',
      validationUrl: `${frontendUrl}/validar?code=tok-lucas-libras`,
      title: 'Certificado de Conclusão — Libras Básico — Extensão FMP 2026',
      description: 'Conclusão com 92% de presença e média 8.5 no curso de Libras Básico.',
      hours: 40,
      metadata: { course: 'Libras Básico — Extensão FMP', instructor: 'Prof. Rafael Santos', aluno: alunoLucas.name, matricula: '20241001' },
    },
  });

  // Certificado de doação — código curto para demo rápida
  // Nota: donation3 já está vinculada ao cert fmp-d003; este é um cert independente (sem donationId)
  await prisma.certificate.upsert({
    where: { authHash: 'tok-civil-001' },
    update: {},
    create: {
      userId: civil.id,
      type: DocType.DONATION_DECLARATION,
      authHash: 'tok-civil-001',
      validationUrl: `${frontendUrl}/validar?code=tok-civil-001`,
      title: 'Comprovante de Doação — Comunidade Palhoça',
      description: 'Doação registrada pela moradora Maria de Lourdes na Campanha de Páscoa FMP 2026.',
      hours: 0,
      metadata: { validator: admin.name, doador: civil.name },
    },
  });

  console.log('[Seed] ✅ Certificados de demo rápida criados (tok-lucas-libras, tok-civil-001)');

  // ─────────────────────────────────────────────────────────────────────────
  // SUMÁRIO FINAL — Credenciais e Hashes de Teste
  // ─────────────────────────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          COPER 3.0 — CREDENCIAIS PARA BANCA PI III (FMP)            ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  PERFIL         EMAIL                            SENHA              ║');
  console.log('║  ─────────────────────────────────────────────────────────────────  ║');
  console.log('║  COPER/Admin    coper@fmpsc.edu.br               Coper@2026         ║');
  console.log('║  Professor      prof.libras@fmpsc.edu.br         Prof@2026          ║');
  console.log('║  Professor      prof.extensao@fmpsc.edu.br       Prof@2026          ║');
  console.log('║  Aluno (Lucas)  lucas.schutz@aluno.fmpsc.edu.br  Aluno@2026         ║');
  console.log('║  Aluno (Edu)    eduardo.silva@aluno.fmpsc.edu.br Aluno@2026         ║');
  console.log('║  Aluno (Davi)   davi.aravechia@aluno.fmpsc.edu.br Aluno@2026        ║');
  console.log('║  Aluno (Vitor)  vitor.emanuel@aluno.fmpsc.edu.br Aluno@2026         ║');
  console.log('║  Aluno (Nico)   nicolas@aluno.fmpsc.edu.br       Aluno@2026         ║');
  console.log('║  Aluna (Ana)    ana.souza@aluno.fmpsc.edu.br     Aluno@2026         ║');
  console.log('║  Aluno INATIVO  aluno.inativo@aluno.fmpsc.edu.br Aluno@2026         ║');
  console.log('║  Empresário     parceiro@empresa.com.br          Empresa@2026       ║');
  console.log('║  Civil          civil@gmail.com                  Civil@2026         ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║          HASHES DE AUTENTICIDADE — /validar?code=<hash>             ║');
  console.log('║  ─────────────────────────────────────────────────────────────────  ║');
  console.log('║  fmp-d001-lucas-agasalho-2026     (Lucas, 10h, Agasalho ATIVA)      ║');
  console.log('║  fmp-d002-eduardo-alimentos-2026  (Eduardo, 15h, Alimentos ATIVA)   ║');
  console.log('║  fmp-d003-civil-pascoa-2026       (Dona Maria, 0h, Páscoa ENC.)     ║');
  console.log('║  fmp-d004-empresa-responsabilidade-2026 (Empresa, 0h, Social)       ║');
  console.log('║  tok-lucas-libras                 (Certificado de Curso Libras)     ║');
  console.log('║  tok-civil-001                    (Comprovante de Doação Civil)     ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  TURMA LIBRAS: 4/4 LOTADA → Vitor #1 e Nicolas #2 na fila!         ║');
  console.log('║  CAMPANHA FUTURA: Natal Solidário FMP 2026 (bloqueio de doações)   ║');
  console.log('║  ALUNO INATIVO: aluno.inativo@aluno.fmpsc.edu.br (testa RN05)      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('');
}

if (process.argv[1]?.includes('seed')) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('[Seed] ERRO:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
