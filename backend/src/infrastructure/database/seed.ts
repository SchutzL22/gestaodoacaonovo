import { prisma } from './prisma.js';
import { PasswordHasher } from '../security/PasswordHasher.js';
import { UserRole, CourseStatus, EnrollmentStatus, DonationStatus, DocType } from '../../domain/enums/index.js';
import { v4 as uuidv4 } from 'uuid';

export async function seed() {
  console.log('[Seed] Iniciando povoamento completo do Sistema COPER 3.0...');

  // 1. Senhas Criptografadas
  const adminPassword = await PasswordHasher.hash('admin123');
  const profPassword = await PasswordHasher.hash('prof123');
  const alunoPassword = await PasswordHasher.hash('aluno123');
  const empresaPassword = await PasswordHasher.hash('empresa123');

  // 1 COPER Admin
  const admin = await prisma.user.upsert({
    where: { email: 'coper@coper.edu.br' },
    update: {},
    create: {
      name: 'Coordenador COPER FMP',
      email: 'coper@coper.edu.br',
      cpf: '00011122233',
      passwordHash: adminPassword,
      role: UserRole.COPER,
    },
  });

  // 2 Professores
  const professorLibras = await prisma.user.upsert({
    where: { email: 'professor.libras@coper.edu.br' },
    update: {},
    create: {
      name: 'Prof. Rafael Santos (Libras)',
      email: 'professor.libras@coper.edu.br',
      cpf: '11122233344',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
    },
  });

  const professorTI = await prisma.user.upsert({
    where: { email: 'professor.ti@coper.edu.br' },
    update: {},
    create: {
      name: 'Profª. Camila Mendes (Informática)',
      email: 'professor.ti@coper.edu.br',
      cpf: '11122233355',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
    },
  });

  // 5 Alunos
  const aluno1 = await prisma.user.upsert({
    where: { email: 'lucas.aluno@aluno.coper.edu.br' },
    update: {},
    create: {
      name: 'Lucas Alexandre Vieira',
      email: 'lucas.aluno@aluno.coper.edu.br',
      cpf: '22233344455',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
    },
  });

  const aluno2 = await prisma.user.upsert({
    where: { email: 'mariana.aluna@aluno.coper.edu.br' },
    update: {},
    create: {
      name: 'Mariana Silva Santos',
      email: 'mariana.aluna@aluno.coper.edu.br',
      cpf: '33344455566',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
    },
  });

  const aluno3 = await prisma.user.upsert({
    where: { email: 'gabriel.costa@aluno.coper.edu.br' },
    update: {},
    create: {
      name: 'Gabriel Costa Ribeiro',
      email: 'gabriel.costa@aluno.coper.edu.br',
      cpf: '44455566688',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
    },
  });

  const aluno4 = await prisma.user.upsert({
    where: { email: 'beatriz.lima@aluno.coper.edu.br' },
    update: {},
    create: {
      name: 'Beatriz Lima de Oliveira',
      email: 'beatriz.lima@aluno.coper.edu.br',
      cpf: '55566677799',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
    },
  });

  const aluno5 = await prisma.user.upsert({
    where: { email: 'matheus.duarte@aluno.coper.edu.br' },
    update: {},
    create: {
      name: 'Matheus Henrique Duarte',
      email: 'matheus.duarte@aluno.coper.edu.br',
      cpf: '66677788800',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
    },
  });

  // 1 Empresário
  const empresario = await prisma.user.upsert({
    where: { email: 'contato@techparceira.com.br' },
    update: {},
    create: {
      name: 'Tech Inovação S/A (Parceiro Empresarial)',
      email: 'contato@techparceira.com.br',
      cpf: '77788899911',
      passwordHash: empresaPassword,
      role: UserRole.EMPRESARIO,
    },
  });

  console.log('[Seed] 1 Admin, 2 Professores, 5 Alunos e 1 Empresário criados.');

  // 2. Cursos Extracurriculares
  const cursoLibras = await prisma.course.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000001',
      title: 'Língua Brasileira de Sinais - Libras Avançado',
      description: 'Aprofundamento prático em interpretação simultânea, vocabulário acadêmico e acessibilidade.',
      instructorId: professorLibras.id,
      workloadHours: 40,
      minAttendancePct: 75.0,
      status: CourseStatus.OPEN,
    },
  });

  const cursoTI = await prisma.course.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000002',
      title: 'Informática Básica e Cidadania Digital',
      description: 'Capacitação prática em ferramentas digitais, suíte de escritório e navegação segura para a comunidade.',
      instructorId: professorTI.id,
      workloadHours: 30,
      minAttendancePct: 75.0,
      status: CourseStatus.OPEN,
    },
  });

  // 3. Turmas
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);

  // Turma 1: Capacidade 2 (Lotada para teste da fila FIFO)
  const turmaLibras = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000011',
      courseId: cursoLibras.id,
      code: 'LIBRAS-2026.1-NOTURNO',
      maxCapacity: 2, // Vagas ativas: Aluno 1 e Aluno 2
      startDate,
      endDate,
      status: CourseStatus.OPEN,
    },
  });

  // Turma 2: Capacidade 25 (Aberta)
  const turmaTI = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000012',
      courseId: cursoTI.id,
      code: 'TI-2026.1-VESPERTINO',
      maxCapacity: 25,
      startDate,
      endDate,
      status: CourseStatus.OPEN,
    },
  });

  // Inscrições na Turma 1:
  // Aluno 1: ACTIVE
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno1.id } },
    update: {},
    create: { classroomId: turmaLibras.id, studentId: aluno1.id, status: EnrollmentStatus.ACTIVE },
  });

  // Aluno 2: ACTIVE (Turma atinge maxCapacity de 2)
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno2.id } },
    update: {},
    create: { classroomId: turmaLibras.id, studentId: aluno2.id, status: EnrollmentStatus.ACTIVE },
  });

  // Aluno 3: WAITLIST posição 1
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno3.id } },
    update: {},
    create: { classroomId: turmaLibras.id, studentId: aluno3.id, status: EnrollmentStatus.WAITLIST, waitlistPosition: 1 },
  });

  // Aluno 4: WAITLIST posição 2
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno4.id } },
    update: {},
    create: { classroomId: turmaLibras.id, studentId: aluno4.id, status: EnrollmentStatus.WAITLIST, waitlistPosition: 2 },
  });

  // Aluno 5: ACTIVE na turma de TI
  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaTI.id, studentId: aluno5.id } },
    update: {},
    create: { classroomId: turmaTI.id, studentId: aluno5.id, status: EnrollmentStatus.ACTIVE },
  });

  console.log('[Seed] Turmas e Fila de Espera FIFO configuradas com sucesso.');

  // 4. Histórico de Doações (3 Aprovadas com Horas e Certificado + 1 Pendente)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Doação 1: Aprovada (Lucas - Aluno -> 10h)
  const d1Hash = 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32';
  const donation1 = await prisma.donation.upsert({
    where: { authHash: d1Hash },
    update: {},
    create: {
      userId: aluno1.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      hoursEarned: 10,
      authHash: d1Hash,
      items: {
        create: [
          { description: 'Arroz Tipo 1 (5kg)', category: 'ALIMENTOS', quantity: 2, unit: 'pacotes' },
          { description: 'Feijão Preto (1kg)', category: 'ALIMENTOS', quantity: 4, unit: 'pacotes' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d1Hash },
    update: {},
    create: {
      userId: aluno1.id,
      donationId: donation1.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d1Hash,
      validationUrl: `${frontendUrl}/validar?code=${d1Hash}`,
      title: 'Declaração de Doação Social - Cestas de Alimentos',
      hours: 10,
      metadata: { items: '2x Arroz 5kg, 4x Feijão 1kg', validator: admin.name },
    },
  });

  // Doação 2: Aprovada (Mariana - Aluna -> 15h)
  const d2Hash = 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4';
  const donation2 = await prisma.donation.upsert({
    where: { authHash: d2Hash },
    update: {},
    create: {
      userId: aluno2.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      hoursEarned: 15,
      authHash: d2Hash,
      items: {
        create: [
          { description: 'Agasalhos de Inverno e Cobertores', category: 'ROUPAS', quantity: 6, unit: 'peças' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d2Hash },
    update: {},
    create: {
      userId: aluno2.id,
      donationId: donation2.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d2Hash,
      validationUrl: `${frontendUrl}/validar?code=${d2Hash}`,
      title: 'Declaração de Doação Social - Campanha do Agasalho',
      hours: 15,
      metadata: { items: '6x Agasalhos/Cobertores', validator: admin.name },
    },
  });

  // Doação 3: Aprovada Corporativa (Empresário -> 0h para Aluno, Comprovante Social)
  const d3Hash = 'c3e5a7b9-1f2d-48a0-98c4-56b901a234f5';
  const donation3 = await prisma.donation.upsert({
    where: { authHash: d3Hash },
    update: {},
    create: {
      userId: empresario.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      hoursEarned: 0, // Empresário não recebe horas complementares acadêmicas
      authHash: d3Hash,
      items: {
        create: [
          { description: 'Kits de Higiene e Limpeza', category: 'HIGIENE', quantity: 50, unit: 'kits' },
        ],
      },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: d3Hash },
    update: {},
    create: {
      userId: empresario.id,
      donationId: donation3.id,
      type: DocType.DONATION_DECLARATION,
      authHash: d3Hash,
      validationUrl: `${frontendUrl}/validar?code=${d3Hash}`,
      title: 'Comprovante Institucional de Responsabilidade Social Empresarial',
      hours: 0,
      metadata: { items: '50x Kits Higiene', enterprise: empresario.name },
    },
  });

  // Doação 4: Pendente (Gabriel - Aluno)
  const d4Hash = uuidv4();
  await prisma.donation.upsert({
    where: { authHash: d4Hash },
    update: {},
    create: {
      userId: aluno3.id,
      status: DonationStatus.PENDING,
      hoursEarned: 0,
      authHash: d4Hash,
      items: {
        create: [
          { description: 'Livros Didáticos e Literatura', category: 'LIVROS', quantity: 12, unit: 'exemplares' },
        ],
      },
    },
  });

  console.log('[Seed] 3 Doações Aprovadas (com Certificados) e 1 Doação Pendente criadas.');
  console.log('[Seed] Povoamento concluído com sucesso!');
}

if (process.argv[1]?.includes('seed')) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
