import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/presentation/app.js';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { Role, CourseStatus, EnrollmentStatus, DocType, UserRole } from '../src/domain/enums/index.js';
import { TokenService } from '../src/infrastructure/security/TokenService.js';

describe('Suíte de Testes Automatizados — Cursos e Fila de Espera FIFO (cursos.test.ts)', () => {
  let professor: any;
  let profToken: string;
  let coperUser: any;
  let coperToken: string;

  let aluno1: any;
  let aluno2: any;
  let aluno3: any;
  let aluno4: any;

  let tokenAluno1: string;
  let tokenAluno2: string;
  let tokenAluno3: string;
  let tokenAluno4: string;

  let course: any;
  let classroom: any;

  beforeAll(async () => {
    // 1. Obter usuários institucionais do seed
    professor = await prisma.user.findFirst({ where: { role: UserRole.PROFESSOR } });
    profToken = TokenService.generateAccessToken({
      userId: professor.id,
      email: professor.email,
      role: Role.PROFESSOR,
    });

    coperUser = await prisma.user.findFirst({ where: { role: UserRole.COPER } });
    coperToken = TokenService.generateAccessToken({
      userId: coperUser.id,
      email: coperUser.email,
      role: Role.COPER,
    });

    // 2. Garantir 4 alunos ativos para testar a fila e promoção
    const alunos = await prisma.user.findMany({
      where: { role: UserRole.ALUNO, isActive: true },
      take: 4,
    });

    aluno1 = alunos[0];
    aluno2 = alunos[1];
    aluno3 = alunos[2];
    aluno4 = alunos[3];

    tokenAluno1 = TokenService.generateAccessToken({ userId: aluno1.id, email: aluno1.email, role: Role.ALUNO });
    tokenAluno2 = TokenService.generateAccessToken({ userId: aluno2.id, email: aluno2.email, role: Role.ALUNO });
    tokenAluno3 = TokenService.generateAccessToken({ userId: aluno3.id, email: aluno3.email, role: Role.ALUNO });
    tokenAluno4 = TokenService.generateAccessToken({ userId: aluno4.id, email: aluno4.email, role: Role.ALUNO });

    // 3. Criar curso de teste com critérios de aprovação (75% freq e média 7.0)
    course = await prisma.course.create({
      data: {
        title: `Curso Teste FIFO QA ${Date.now()}`,
        description: 'Curso automatizado para testes de fila de espera e certificação',
        instructorId: professor.id,
        workloadHours: 40,
        minAttendancePct: 75.0,
        status: CourseStatus.OPEN,
      },
    });

    // 4. Criar turma com capacidade restrita para 2 vagas (para testar lotação e fila)
    classroom = await prisma.classroom.create({
      data: {
        courseId: course.id,
        code: `TURMA-FIFO-${Date.now().toString().slice(-4)}`,
        maxCapacity: 2,
        minGrade: 7.0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-30'),
        enrollmentStartDate: new Date('2026-01-01'),
        enrollmentEndDate: new Date('2026-12-31'),
        status: CourseStatus.OPEN,
      },
    });
  });

  afterAll(async () => {
    // Limpeza em cascade da turma e curso criados
    if (classroom) {
      await prisma.certificate.deleteMany({ where: { enrollment: { classroomId: classroom.id } } });
      await prisma.attendance.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.enrollment.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.classroom.delete({ where: { id: classroom.id } });
    }
    if (course) {
      await prisma.course.delete({ where: { id: course.id } });
    }
  });

  describe('1. Inscrição em Turma Lotada e Alocação na Fila de Espera FIFO', () => {
    it('deve matricular os 2 primeiros alunos com status ACTIVE e waitlistPosition = null', async () => {
      // Inscrição Aluno 1
      const res1 = await request(app)
        .post(`/api/classrooms/${classroom.id}/enroll`)
        .set('Authorization', `Bearer ${tokenAluno1}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.isWaitlist).toBe(false);
      expect(res1.body.data.enrollment.status).toBe(EnrollmentStatus.ACTIVE);
      expect(res1.body.data.enrollment.waitlistPosition).toBeNull();

      // Inscrição Aluno 2 (preenche a 2ª vaga -> turma 2/2 lotada)
      const res2 = await request(app)
        .post(`/api/classrooms/${classroom.id}/enroll`)
        .set('Authorization', `Bearer ${tokenAluno2}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.isWaitlist).toBe(false);
      expect(res2.body.data.enrollment.status).toBe(EnrollmentStatus.ACTIVE);
      expect(res2.body.data.enrollment.waitlistPosition).toBeNull();
    });

    it('deve alocar o 3º aluno na FILA DE ESPERA na posição #1', async () => {
      const res3 = await request(app)
        .post(`/api/classrooms/${classroom.id}/enroll`)
        .set('Authorization', `Bearer ${tokenAluno3}`);

      expect(res3.status).toBe(200);
      expect(res3.body.data.isWaitlist).toBe(true);
      expect(res3.body.data.position).toBe(1);
      expect(res3.body.data.enrollment.status).toBe(EnrollmentStatus.WAITLIST);
      expect(res3.body.data.enrollment.waitlistPosition).toBe(1);
    });

    it('deve alocar o 4º aluno na FILA DE ESPERA na posição #2', async () => {
      const res4 = await request(app)
        .post(`/api/classrooms/${classroom.id}/enroll`)
        .set('Authorization', `Bearer ${tokenAluno4}`);

      expect(res4.status).toBe(200);
      expect(res4.body.data.isWaitlist).toBe(true);
      expect(res4.body.data.position).toBe(2);
      expect(res4.body.data.enrollment.status).toBe(EnrollmentStatus.WAITLIST);
      expect(res4.body.data.enrollment.waitlistPosition).toBe(2);
    });

    it('deve exibir a fila de espera ordenada corretamente na consulta da COPER', async () => {
      const resWaitlist = await request(app)
        .get(`/api/classrooms/${classroom.id}/waitlist`)
        .set('Authorization', `Bearer ${coperToken}`);

      expect(resWaitlist.status).toBe(200);
      expect(resWaitlist.body.data.activeCount).toBe(2);
      expect(resWaitlist.body.data.waitlistCount).toBe(2);
      expect(resWaitlist.body.data.waitlist[0].studentId).toBe(aluno3.id);
      expect(resWaitlist.body.data.waitlist[0].position).toBe(1);
      expect(resWaitlist.body.data.waitlist[1].studentId).toBe(aluno4.id);
      expect(resWaitlist.body.data.waitlist[1].position).toBe(2);
    });
  });

  describe('2. Promoção Transacional Atômica ao Cancelar Matrícula Ativa', () => {
    it('deve cancelar o aluno ativo 1, promover automaticamente o suplente #1 (aluno 3) para ACTIVE e reordenar a fila', async () => {
      // Aluno 1 desiste da turma
      const resCancel = await request(app)
        .post(`/api/classrooms/${classroom.id}/cancel`)
        .set('Authorization', `Bearer ${tokenAluno1}`);

      expect(resCancel.status).toBe(200);
      expect(resCancel.body.status).toBe('success');
      expect(resCancel.body.data.promotedStudent).toBeDefined();
      expect(resCancel.body.data.promotedStudent.id).toBe(aluno3.id);

      // 1. Inscrição do Aluno 1 agora deve ser CANCELLED
      const enrAluno1 = await prisma.enrollment.findUnique({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: aluno1.id } },
      });
      expect(enrAluno1?.status).toBe(EnrollmentStatus.CANCELLED);

      // 2. Aluno 3 deve ter sido promovido para ACTIVE com waitlistPosition = null
      const enrAluno3 = await prisma.enrollment.findUnique({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: aluno3.id } },
      });
      expect(enrAluno3?.status).toBe(EnrollmentStatus.ACTIVE);
      expect(enrAluno3?.waitlistPosition).toBeNull();

      // 3. Aluno 4 deve ter avançado para a posição #1 da fila de espera
      const enrAluno4 = await prisma.enrollment.findUnique({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: aluno4.id } },
      });
      expect(enrAluno4?.status).toBe(EnrollmentStatus.WAITLIST);
      expect(enrAluno4?.waitlistPosition).toBe(1);
    });
  });

  describe('3. Encerramento de Turma, Critério Duplo e Emissão de Certificados', () => {
    it('deve aprovar apenas alunos com frequência >= 75% e média >= 7.0, emitindo diploma oficial com QR Code', async () => {
      // Turma possui 2 alunos ativos: Aluno 2 e Aluno 3
      const enrAluno2 = await prisma.enrollment.findUnique({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: aluno2.id } },
      });
      const enrAluno3 = await prisma.enrollment.findUnique({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: aluno3.id } },
      });

      // Lançar notas:
      // Aluno 2: Notas 8.0, 8.5, 7.5 (Média = 8.0 >= 7.0)
      // Aluno 3: Notas 9.0, 9.5, 8.5 (Média = 9.0 >= 7.0)
      await request(app)
        .patch(`/api/classrooms/${classroom.id}/grades`)
        .set('Authorization', `Bearer ${profToken}`)
        .send({
          grades: [
            { enrollmentId: enrAluno2!.id, gradeA1: 8.0, gradeA2: 8.5, gradeA3: 7.5 },
            { enrollmentId: enrAluno3!.id, gradeA1: 9.0, gradeA2: 9.5, gradeA3: 8.5 },
          ],
        });

      // Registrar 4 aulas de presença:
      // Aluno 2: Presente em 4 das 4 aulas (100% frequência >= 75%) -> DEVE APROVAR
      // Aluno 3: Presente em apenas 2 das 4 aulas (50% frequência < 75%) -> DEVE REPROVAR
      const datas = [
        new Date('2026-03-05'),
        new Date('2026-03-12'),
        new Date('2026-03-19'),
        new Date('2026-03-26'),
      ];

      for (const d of datas) {
        // Aluno 2 sempre presente
        await prisma.attendance.create({
          data: { classroomId: classroom.id, studentId: aluno2.id, classDate: d, isPresent: true },
        });
      }

      // Aluno 3 presente apenas em 2 aulas (50%)
      await prisma.attendance.create({
        data: { classroomId: classroom.id, studentId: aluno3.id, classDate: datas[0], isPresent: true },
      });
      await prisma.attendance.create({
        data: { classroomId: classroom.id, studentId: aluno3.id, classDate: datas[1], isPresent: true },
      });
      await prisma.attendance.create({
        data: { classroomId: classroom.id, studentId: aluno3.id, classDate: datas[2], isPresent: false },
      });
      await prisma.attendance.create({
        data: { classroomId: classroom.id, studentId: aluno3.id, classDate: datas[3], isPresent: false },
      });

      // Professor encerra a turma
      const resClose = await request(app)
        .post(`/api/classrooms/${classroom.id}/close`)
        .set('Authorization', `Bearer ${profToken}`);

      expect(resClose.status).toBe(200);
      expect(resClose.body.status).toBe('success');

      // Status da turma agora é FINISHED
      const turmaFinal = await prisma.classroom.findUnique({ where: { id: classroom.id } });
      expect(turmaFinal?.status).toBe(CourseStatus.FINISHED);

      // Aluno 2: APROVADO (COMPLETED) com certificado
      const enr2Final = await prisma.enrollment.findUnique({
        where: { id: enrAluno2!.id },
        include: { certificate: true },
      });
      expect(enr2Final?.status).toBe(EnrollmentStatus.COMPLETED);
      expect(enr2Final?.attendancePercentage).toBe(100);
      expect(enr2Final?.finalGrade).toBe(8.0);
      expect(enr2Final?.certificate).toBeDefined();
      expect(enr2Final?.certificate?.type).toBe(DocType.COURSE_CERTIFICATE);

      // Aluno 3: REPROVADO (FAILED) por frequência insuficiente (sem certificado)
      const enr3Final = await prisma.enrollment.findUnique({
        where: { id: enrAluno3!.id },
        include: { certificate: true },
      });
      expect(enr3Final?.status).toBe(EnrollmentStatus.FAILED);
      expect(enr3Final?.attendancePercentage).toBe(50);
      expect(enr3Final?.certificate).toBeNull();

      // Validação pública do diploma emitido para Aluno 2
      const authHashCert = enr2Final!.certificate!.authHash;
      const resValida = await request(app).get(`/api/public/validar/${authHashCert}`);

      expect(resValida.status).toBe(200);
      expect(resValida.body.status).toBe('success');
      expect(resValida.body.data.isValid).toBe(true);
      expect(resValida.body.data.documentType).toBe(DocType.COURSE_CERTIFICATE);
      expect(resValida.body.data.holderName).toContain(aluno2.name);
      expect(resValida.body.data.hoursEarned).toBe(course.workloadHours);
    });
  });
});
