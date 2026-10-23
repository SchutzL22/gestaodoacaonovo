"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
const prisma_js_1 = require("./prisma.js");
const PasswordHasher_js_1 = require("../security/PasswordHasher.js");
const index_js_1 = require("../../domain/enums/index.js");
const uuid_1 = require("uuid");
async function seed() {
    console.log('[Seed] Iniciando povoamento completo do Sistema COPER 3.0...');
    const adminPassword = await PasswordHasher_js_1.PasswordHasher.hash('admin123');
    const profPassword = await PasswordHasher_js_1.PasswordHasher.hash('prof123');
    const alunoPassword = await PasswordHasher_js_1.PasswordHasher.hash('aluno123');
    const empresaPassword = await PasswordHasher_js_1.PasswordHasher.hash('empresa123');
    const admin = await prisma_js_1.prisma.user.upsert({
        where: { email: 'coper@coper.edu.br' },
        update: {},
        create: {
            name: 'Coordenador COPER FMP',
            email: 'coper@coper.edu.br',
            cpf: '00011122233',
            passwordHash: adminPassword,
            role: index_js_1.UserRole.COPER,
        },
    });
    const professorLibras = await prisma_js_1.prisma.user.upsert({
        where: { email: 'professor.libras@coper.edu.br' },
        update: {},
        create: {
            name: 'Prof. Rafael Santos (Libras)',
            email: 'professor.libras@coper.edu.br',
            cpf: '11122233344',
            passwordHash: profPassword,
            role: index_js_1.UserRole.PROFESSOR,
        },
    });
    const professorTI = await prisma_js_1.prisma.user.upsert({
        where: { email: 'professor.ti@coper.edu.br' },
        update: {},
        create: {
            name: 'Profª. Camila Mendes (Informática)',
            email: 'professor.ti@coper.edu.br',
            cpf: '11122233355',
            passwordHash: profPassword,
            role: index_js_1.UserRole.PROFESSOR,
        },
    });
    const aluno1 = await prisma_js_1.prisma.user.upsert({
        where: { email: 'lucas.aluno@aluno.coper.edu.br' },
        update: {},
        create: {
            name: 'Lucas Alexandre Vieira',
            email: 'lucas.aluno@aluno.coper.edu.br',
            cpf: '22233344455',
            passwordHash: alunoPassword,
            role: index_js_1.UserRole.ALUNO,
        },
    });
    const aluno2 = await prisma_js_1.prisma.user.upsert({
        where: { email: 'mariana.aluna@aluno.coper.edu.br' },
        update: {},
        create: {
            name: 'Mariana Silva Santos',
            email: 'mariana.aluna@aluno.coper.edu.br',
            cpf: '33344455566',
            passwordHash: alunoPassword,
            role: index_js_1.UserRole.ALUNO,
        },
    });
    const aluno3 = await prisma_js_1.prisma.user.upsert({
        where: { email: 'gabriel.costa@aluno.coper.edu.br' },
        update: {},
        create: {
            name: 'Gabriel Costa Ribeiro',
            email: 'gabriel.costa@aluno.coper.edu.br',
            cpf: '44455566688',
            passwordHash: alunoPassword,
            role: index_js_1.UserRole.ALUNO,
        },
    });
    const aluno4 = await prisma_js_1.prisma.user.upsert({
        where: { email: 'beatriz.lima@aluno.coper.edu.br' },
        update: {},
        create: {
            name: 'Beatriz Lima de Oliveira',
            email: 'beatriz.lima@aluno.coper.edu.br',
            cpf: '55566677799',
            passwordHash: alunoPassword,
            role: index_js_1.UserRole.ALUNO,
        },
    });
    const aluno5 = await prisma_js_1.prisma.user.upsert({
        where: { email: 'matheus.duarte@aluno.coper.edu.br' },
        update: {},
        create: {
            name: 'Matheus Henrique Duarte',
            email: 'matheus.duarte@aluno.coper.edu.br',
            cpf: '66677788800',
            passwordHash: alunoPassword,
            role: index_js_1.UserRole.ALUNO,
        },
    });
    const empresario = await prisma_js_1.prisma.user.upsert({
        where: { email: 'contato@techparceira.com.br' },
        update: {},
        create: {
            name: 'Tech Inovação S/A (Parceiro Empresarial)',
            email: 'contato@techparceira.com.br',
            cpf: '77788899911',
            passwordHash: empresaPassword,
            role: index_js_1.UserRole.EMPRESARIO,
        },
    });
    console.log('[Seed] 1 Admin, 2 Professores, 5 Alunos e 1 Empresário criados.');
    const cursoLibras = await prisma_js_1.prisma.course.upsert({
        where: { id: 'c0a80123-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: 'c0a80123-0000-0000-0000-000000000001',
            title: 'Língua Brasileira de Sinais - Libras Avançado',
            description: 'Aprofundamento prático em interpretação simultânea, vocabulário acadêmico e acessibilidade.',
            instructorId: professorLibras.id,
            workloadHours: 40,
            minAttendancePct: 75.0,
            status: index_js_1.CourseStatus.OPEN,
        },
    });
    const cursoTI = await prisma_js_1.prisma.course.upsert({
        where: { id: 'c0a80123-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: 'c0a80123-0000-0000-0000-000000000002',
            title: 'Informática Básica e Cidadania Digital',
            description: 'Capacitação prática em ferramentas digitais, suíte de escritório e navegação segura para a comunidade.',
            instructorId: professorTI.id,
            workloadHours: 30,
            minAttendancePct: 75.0,
            status: index_js_1.CourseStatus.OPEN,
        },
    });
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    const turmaLibras = await prisma_js_1.prisma.classroom.upsert({
        where: { id: 'c0a80123-0000-0000-0000-000000000011' },
        update: {},
        create: {
            id: 'c0a80123-0000-0000-0000-000000000011',
            courseId: cursoLibras.id,
            code: 'LIBRAS-2026.1-NOTURNO',
            maxCapacity: 2,
            startDate,
            endDate,
            status: index_js_1.CourseStatus.OPEN,
        },
    });
    const turmaTI = await prisma_js_1.prisma.classroom.upsert({
        where: { id: 'c0a80123-0000-0000-0000-000000000012' },
        update: {},
        create: {
            id: 'c0a80123-0000-0000-0000-000000000012',
            courseId: cursoTI.id,
            code: 'TI-2026.1-VESPERTINO',
            maxCapacity: 25,
            startDate,
            endDate,
            status: index_js_1.CourseStatus.OPEN,
        },
    });
    await prisma_js_1.prisma.enrollment.upsert({
        where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno1.id } },
        update: {},
        create: { classroomId: turmaLibras.id, studentId: aluno1.id, status: index_js_1.EnrollmentStatus.ACTIVE },
    });
    await prisma_js_1.prisma.enrollment.upsert({
        where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno2.id } },
        update: {},
        create: { classroomId: turmaLibras.id, studentId: aluno2.id, status: index_js_1.EnrollmentStatus.ACTIVE },
    });
    await prisma_js_1.prisma.enrollment.upsert({
        where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno3.id } },
        update: {},
        create: { classroomId: turmaLibras.id, studentId: aluno3.id, status: index_js_1.EnrollmentStatus.WAITLIST, waitlistPosition: 1 },
    });
    await prisma_js_1.prisma.enrollment.upsert({
        where: { classroomId_studentId: { classroomId: turmaLibras.id, studentId: aluno4.id } },
        update: {},
        create: { classroomId: turmaLibras.id, studentId: aluno4.id, status: index_js_1.EnrollmentStatus.WAITLIST, waitlistPosition: 2 },
    });
    await prisma_js_1.prisma.enrollment.upsert({
        where: { classroomId_studentId: { classroomId: turmaTI.id, studentId: aluno5.id } },
        update: {},
        create: { classroomId: turmaTI.id, studentId: aluno5.id, status: index_js_1.EnrollmentStatus.ACTIVE },
    });
    console.log('[Seed] Turmas e Fila de Espera FIFO configuradas com sucesso.');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const d1Hash = 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32';
    const donation1 = await prisma_js_1.prisma.donation.upsert({
        where: { authHash: d1Hash },
        update: {},
        create: {
            userId: aluno1.id,
            status: index_js_1.DonationStatus.APPROVED,
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
    await prisma_js_1.prisma.certificate.upsert({
        where: { authHash: d1Hash },
        update: {},
        create: {
            userId: aluno1.id,
            donationId: donation1.id,
            type: index_js_1.DocType.DONATION_DECLARATION,
            authHash: d1Hash,
            validationUrl: `${frontendUrl}/validar?code=${d1Hash}`,
            title: 'Declaração de Doação Social - Cestas de Alimentos',
            hours: 10,
            metadata: { items: '2x Arroz 5kg, 4x Feijão 1kg', validator: admin.name },
        },
    });
    const d2Hash = 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4';
    const donation2 = await prisma_js_1.prisma.donation.upsert({
        where: { authHash: d2Hash },
        update: {},
        create: {
            userId: aluno2.id,
            status: index_js_1.DonationStatus.APPROVED,
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
    await prisma_js_1.prisma.certificate.upsert({
        where: { authHash: d2Hash },
        update: {},
        create: {
            userId: aluno2.id,
            donationId: donation2.id,
            type: index_js_1.DocType.DONATION_DECLARATION,
            authHash: d2Hash,
            validationUrl: `${frontendUrl}/validar?code=${d2Hash}`,
            title: 'Declaração de Doação Social - Campanha do Agasalho',
            hours: 15,
            metadata: { items: '6x Agasalhos/Cobertores', validator: admin.name },
        },
    });
    const d3Hash = 'c3e5a7b9-1f2d-48a0-98c4-56b901a234f5';
    const donation3 = await prisma_js_1.prisma.donation.upsert({
        where: { authHash: d3Hash },
        update: {},
        create: {
            userId: empresario.id,
            status: index_js_1.DonationStatus.APPROVED,
            validatedByUserId: admin.id,
            hoursEarned: 0,
            authHash: d3Hash,
            items: {
                create: [
                    { description: 'Kits de Higiene e Limpeza', category: 'HIGIENE', quantity: 50, unit: 'kits' },
                ],
            },
        },
    });
    await prisma_js_1.prisma.certificate.upsert({
        where: { authHash: d3Hash },
        update: {},
        create: {
            userId: empresario.id,
            donationId: donation3.id,
            type: index_js_1.DocType.DONATION_DECLARATION,
            authHash: d3Hash,
            validationUrl: `${frontendUrl}/validar?code=${d3Hash}`,
            title: 'Comprovante Institucional de Responsabilidade Social Empresarial',
            hours: 0,
            metadata: { items: '50x Kits Higiene', enterprise: empresario.name },
        },
    });
    const d4Hash = (0, uuid_1.v4)();
    await prisma_js_1.prisma.donation.upsert({
        where: { authHash: d4Hash },
        update: {},
        create: {
            userId: aluno3.id,
            status: index_js_1.DonationStatus.PENDING,
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
        await prisma_js_1.prisma.$disconnect();
    })
        .catch(async (e) => {
        console.error(e);
        await prisma_js_1.prisma.$disconnect();
        process.exit(1);
    });
}
