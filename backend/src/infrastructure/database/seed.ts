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
import { v4 as uuidv4 } from 'uuid';

export async function seed() {
  console.log('[Seed] Iniciando povoamento completo do Sistema COPER 3.0...');

  // 1. Senhas Criptografadas
  const adminPassword = await PasswordHasher.hash('admin123');
  const profPassword = await PasswordHasher.hash('prof123');
  const alunoPassword = await PasswordHasher.hash('aluno123');
  const empresaPassword = await PasswordHasher.hash('empresa123');
  const civilPassword = await PasswordHasher.hash('civil123');

  // Perfil 1: COPER Admin (Gerenciamento geral)
  const admin = await prisma.user.upsert({
    where: { email: 'coper@coper.edu.br' },
    update: { isActive: true },
    create: {
      name: 'Coordenador COPER FMP',
      email: 'coper@coper.edu.br',
      cpf: '00011122233',
      passwordHash: adminPassword,
      role: UserRole.COPER,
      phone: '(48) 3279-0000',
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@fmpsc.edu.br' },
    update: { isActive: true },
    create: {
      name: 'Administrador COPER FMP',
      email: 'admin@fmpsc.edu.br',
      cpf: '00011122299',
      passwordHash: adminPassword,
      role: UserRole.COPER,
      phone: '(48) 3279-0001',
      isActive: true,
    },
  });

  // Perfil 2: PROFESSOR (Cursos, turmas, notas, doações sem horas)
  const professorLibras = await prisma.user.upsert({
    where: { email: 'professor.libras@coper.edu.br' },
    update: { isActive: true },
    create: {
      name: 'Prof. Rafael Santos (Libras)',
      email: 'professor.libras@coper.edu.br',
      cpf: '11122233344',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
      phone: '(48) 99111-2233',
      isActive: true,
    },
  });

  const professorTI = await prisma.user.upsert({
    where: { email: 'professor.ti@coper.edu.br' },
    update: { isActive: true },
    create: {
      name: 'Profª. Camila Mendes (Informática)',
      email: 'professor.ti@coper.edu.br',
      cpf: '11122233355',
      passwordHash: profPassword,
      role: UserRole.PROFESSOR,
      phone: '(48) 99111-4455',
      isActive: true,
    },
  });

  // Perfil 3: ALUNO (Matrícula obrigatória, limite semestral, horas complementares)
  const aluno1 = await prisma.user.upsert({
    where: { email: 'lucas.aluno@aluno.coper.edu.br' },
    update: {
      matricula: '20261001',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Lucas Alexandre Vieira',
      email: 'lucas.aluno@aluno.coper.edu.br',
      cpf: '22233344455',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261001',
      phone: '(48) 99222-3344',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 10,
    },
  });

  await prisma.user.upsert({
    where: { email: 'lucas@aluno.fmpsc.edu.br' },
    update: {
      matricula: '20261099',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Lucas Alexandre Vieira',
      email: 'lucas@aluno.fmpsc.edu.br',
      cpf: '22233344499',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261099',
      phone: '(48) 99222-3399',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 10,
    },
  });

  const aluno2 = await prisma.user.upsert({
    where: { email: 'mariana.aluna@aluno.coper.edu.br' },
    update: {
      matricula: '20261002',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Mariana Silva Santos',
      email: 'mariana.aluna@aluno.coper.edu.br',
      cpf: '33344455566',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261002',
      phone: '(48) 99333-4455',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 15,
    },
  });

  const aluno3 = await prisma.user.upsert({
    where: { email: 'gabriel.costa@aluno.coper.edu.br' },
    update: {
      matricula: '20261003',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Gabriel Costa Ribeiro',
      email: 'gabriel.costa@aluno.coper.edu.br',
      cpf: '44455566688',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261003',
      phone: '(48) 99444-5566',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  const aluno4 = await prisma.user.upsert({
    where: { email: 'beatriz.lima@aluno.coper.edu.br' },
    update: {
      matricula: '20261004',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Beatriz Lima de Oliveira',
      email: 'beatriz.lima@aluno.coper.edu.br',
      cpf: '55566677799',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261004',
      phone: '(48) 99555-6677',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  const aluno5 = await prisma.user.upsert({
    where: { email: 'matheus.duarte@aluno.coper.edu.br' },
    update: {
      matricula: '20261005',
      isActive: true,
      semesterHoursLimit: 40,
    },
    create: {
      name: 'Matheus Henrique Duarte',
      email: 'matheus.duarte@aluno.coper.edu.br',
      cpf: '66677788800',
      passwordHash: alunoPassword,
      role: UserRole.ALUNO,
      matricula: '20261005',
      phone: '(48) 99666-7788',
      isActive: true,
      semesterHoursLimit: 40,
      totalHoursEarned: 0,
    },
  });

  // Perfil 4: EMPRESARIO (Dashboards analíticos de impacto social, sem horas de aluno)
  const empresario = await prisma.user.upsert({
    where: { email: 'contato@techparceira.com.br' },
    update: { isActive: true },
    create: {
      name: 'Tech Inovação S/A (Parceiro Empresarial)',
      email: 'contato@techparceira.com.br',
      cpf: '77788899911',
      passwordHash: empresaPassword,
      role: UserRole.EMPRESARIO,
      phone: '(48) 3344-5500',
      address: 'Rodovia SC-401, Km 4, Saco Grande, Florianópolis - SC',
      isActive: true,
    },
  });

  // Perfil 5: CIVIL (Comunidade externa, cadastro pessoal com endereço e CPF)
  const civil = await prisma.user.upsert({
    where: { email: 'comunidade.palhoca@gmail.com' },
    update: { isActive: true },
    create: {
      name: 'Dona Maria de Lourdes (Comunidade)',
      email: 'comunidade.palhoca@gmail.com',
      cpf: '88899900022',
      passwordHash: civilPassword,
      role: UserRole.CIVIL,
      phone: '(48) 99888-7766',
      address: 'Rua das Flores, 120, Centro, Palhoça - SC',
      isActive: true,
    },
  });

  console.log('[Seed] 5 Perfis configurados: COPER, PROFESSOR, ALUNO, EMPRESARIO, CIVIL.');

  // 2. Campanhas e Itens Prioritários
  const campaign1 = await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000101',
      title: 'Campanha do Agasalho FMP 2026',
      description: 'Arrecadação de agasalhos, cobertores e roupas de inverno para a comunidade de Palhoça.',
      status: CampaignStatus.ACTIVE,
      isUrgent: true,
      hoursLimit: 20,
      conversionRules: '1 agasalho/cobertor = 2.5 horas complementares (máx. 20h)',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-07-31'),
      priorityItems: {
        create: [
          { name: 'Casacos e Jaquetas de Inverno', goal: 100, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Cobertores Térmicos', goal: 60, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Meias e Luvas Infantis', goal: 80, urgencyLevel: 'MEDIA', isUrgent: false },
        ],
      },
    },
  });

  const campaign2 = await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000102',
      title: 'Arrecadação de Alimentos e Cestas Básicas',
      description: 'Doação de alimentos não perecíveis prioritários (arroz, feijão, macarrão, óleo e leite).',
      status: CampaignStatus.ACTIVE,
      isUrgent: false,
      hoursLimit: 30,
      conversionRules: '5kg de alimentos = 5 horas complementares (máx. 30h)',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-11-30'),
      priorityItems: {
        create: [
          { name: 'Arroz Tipo 1 (5kg)', goal: 150, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Feijão Preto (1kg)', goal: 200, urgencyLevel: 'ALTA', isUrgent: true },
          { name: 'Leite em Pó Integral', goal: 100, urgencyLevel: 'MEDIA', isUrgent: false },
        ],
      },
    },
  });

  await prisma.campaign.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: 'c0a80123-0000-0000-0000-000000000103',
      title: 'Campanha de Livros e Cidadania Digital',
      description: 'Doação de livros didáticos, literatura e materiais de informática para escolas públicas parceiras.',
      status: CampaignStatus.FUTURE,
      isUrgent: false,
      hoursLimit: 15,
      conversionRules: '1 livro didático = 1.5 horas complementares',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-10-31'),
      priorityItems: {
        create: [
          { name: 'Livros de Ensino Fundamental/Médio', goal: 80, urgencyLevel: 'NORMAL', isUrgent: false },
        ],
      },
    },
  });

  console.log('[Seed] Campanhas e Itens Prioritários cadastrados.');

  // 3. Cursos Extracurriculares
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

  // 4. Turmas e Fila FIFO
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 7);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);

  const enrollmentStartDate = new Date();
  enrollmentStartDate.setDate(enrollmentStartDate.getDate() - 5);
  const enrollmentEndDate = new Date();
  enrollmentEndDate.setDate(enrollmentEndDate.getDate() + 5);

  const cancellationDeadline = new Date();
  cancellationDeadline.setDate(cancellationDeadline.getDate() + 14);

  const turmaLibras = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000011' },
    update: {
      minGrade: 7.0,
      enrollmentStartDate,
      enrollmentEndDate,
      cancellationDeadline,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000011',
      courseId: cursoLibras.id,
      code: 'LIBRAS-2026.1-NOTURNO',
      maxCapacity: 2,
      startDate,
      endDate,
      enrollmentStartDate,
      enrollmentEndDate,
      cancellationDeadline,
      minGrade: 7.0,
      status: CourseStatus.OPEN,
    },
  });

  const turmaTI = await prisma.classroom.upsert({
    where: { id: 'c0a80123-0000-0000-0000-000000000012' },
    update: {
      minGrade: 7.0,
      enrollmentStartDate,
      enrollmentEndDate,
      cancellationDeadline,
    },
    create: {
      id: 'c0a80123-0000-0000-0000-000000000012',
      courseId: cursoTI.id,
      code: 'TI-2026.1-VESPERTINO',
      maxCapacity: 25,
      startDate,
      endDate,
      enrollmentStartDate,
      enrollmentEndDate,
      cancellationDeadline,
      minGrade: 7.0,
      status: CourseStatus.OPEN,
    },
  });

  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno1.id } },
    update: {
      gradeA1: 8.5,
      gradeA2: 9.0,
      gradeA3: 8.0,
      finalGrade: 8.5,
      attendancePercentage: 92.0,
    },
    create: {
      classroomId: turmaLibras.id,
      studentId: aluno1.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 8.5,
      gradeA2: 9.0,
      gradeA3: 8.0,
      finalGrade: 8.5,
      attendancePercentage: 92.0,
    },
  });

  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno2.id } },
    update: {
      gradeA1: 7.0,
      gradeA2: 7.5,
      gradeA3: 8.0,
      finalGrade: 7.5,
      attendancePercentage: 85.0,
    },
    create: {
      classroomId: turmaLibras.id,
      studentId: aluno2.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 7.0,
      gradeA2: 7.5,
      gradeA3: 8.0,
      finalGrade: 7.5,
      attendancePercentage: 85.0,
    },
  });

  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno3.id } },
    update: {},
    create: {
      classroomId: turmaLibras.id,
      studentId: aluno3.id,
      status: EnrollmentStatus.WAITLIST,
      waitlistPosition: 1,
    },
  });

  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno4.id } },
    update: {},
    create: {
      classroomId: turmaLibras.id,
      studentId: aluno4.id,
      status: EnrollmentStatus.WAITLIST,
      waitlistPosition: 2,
    },
  });

  await prisma.enrollment.upsert({
    where: { classroomId_studentId: { classroomId: turmaTI.id, studentId: aluno5.id } },
    update: {
      gradeA1: 9.0,
      gradeA2: 9.5,
      gradeA3: 9.0,
      finalGrade: 9.2,
      attendancePercentage: 100.0,
    },
    create: {
      classroomId: turmaTI.id,
      studentId: aluno5.id,
      status: EnrollmentStatus.ACTIVE,
      gradeA1: 9.0,
      gradeA2: 9.5,
      gradeA3: 9.0,
      finalGrade: 9.2,
      attendancePercentage: 100.0,
    },
  });

  console.log('[Seed] Turmas e Fila FIFO configuradas.');

  // 5. Histórico de Doações
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
      receivedById: admin.id,
      campaignId: campaign2.id,
      hoursEarned: 10,
      authHash: d1Hash,
      observation: 'Itens conferidos no balcão COPER em perfeito estado.',
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
      receivedById: admin.id,
      campaignId: campaign1.id,
      hoursEarned: 15,
      authHash: d2Hash,
      observation: 'Roupas higienizadas e separadas para triagem.',
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
      receivedById: admin.id,
      hoursEarned: 0,
      authHash: d3Hash,
      observation: 'Doação de responsabilidade social corporativa entregue na sede da FMP.',
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

  // Doação 4: Doação da Comunidade CIVIL (0 horas acadêmicas)
  const d4Hash = 'd4f6b8c0-2e3a-49b1-87c5-67c012b345f6';
  await prisma.donation.upsert({
    where: { authHash: d4Hash },
    update: {},
    create: {
      userId: civil.id,
      status: DonationStatus.APPROVED,
      validatedByUserId: admin.id,
      receivedById: admin.id,
      hoursEarned: 0,
      authHash: d4Hash,
      donorName: civil.name,
      donorCpf: civil.cpf,
      observation: 'Doação de moradora da comunidade de Palhoça.',
      items: {
        create: [
          { description: 'Pacotes de Fraldas Geriátricas', category: 'HIGIENE', quantity: 10, unit: 'pacotes' },
        ],
      },
    },
  });

  // Doação 5: Pendente (Gabriel - Aluno)
  const d5Hash = uuidv4();
  await prisma.donation.upsert({
    where: { authHash: d5Hash },
    update: {},
    create: {
      userId: aluno3.id,
      status: DonationStatus.PENDING,
      receivedById: admin.id,
      hoursEarned: 0,
      authHash: d5Hash,
      observation: 'Aguardando conferência física dos livros na recepção.',
      items: {
        create: [
          { description: 'Livros Didáticos e Literatura', category: 'LIVROS', quantity: 12, unit: 'exemplares' },
        ],
      },
    },
  });

  // 6. Certificados com Códigos Amigáveis para Testes
  await prisma.certificate.upsert({
    where: { authHash: 'tok-luc-001' },
    update: {},
    create: {
      userId: aluno1.id,
      type: DocType.DONATION_DECLARATION,
      authHash: 'tok-luc-001',
      validationUrl: `${frontendUrl}/validar?code=tok-luc-001`,
      title: 'Declaração Oficial de Doação Social - Cestas de Alimentos',
      description: 'Doação de alimentos não perecíveis entregues na sede da FMP.',
      hours: 10,
      metadata: { items: '2x Arroz 5kg, 4x Feijão 1kg', validator: admin.name },
    },
  });

  await prisma.certificate.upsert({
    where: { authHash: 'tok-edu-001' },
    update: {},
    create: {
      userId: aluno2.id,
      type: DocType.COURSE_CERTIFICATE,
      authHash: 'tok-edu-001',
      validationUrl: `${frontendUrl}/validar?code=tok-edu-001`,
      title: 'Certificado de Conclusão de Curso Extracurricular - Libras Avançado',
      description: 'Conclusão com 100% de presença no curso de Língua Brasileira de Sinais.',
      hours: 40,
      metadata: { course: 'Libras Avançado', instructor: 'Prof. Rafael Santos' },
    },
  });

  console.log('[Seed] Certificados tok-luc-001 e tok-edu-001 configurados.');
  console.log('[Seed] 4 Doações Aprovadas (com Certificados) e 1 Doação Pendente criadas.');
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
