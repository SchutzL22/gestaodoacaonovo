import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { CourseStatus, EnrollmentStatus, DocType, UserRole } from '../../../domain/enums/index.js';
import { MailService } from '../../../infrastructure/mail/MailService.js';
import { NotificationService } from '../../services/NotificationService.js';

export class CloseClassroomUseCase {
  async execute(classroomId: string, userId: string, userRole: UserRole) {
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        course: true,
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          include: { student: true },
        },
      },
    });

    if (!classroom) {
      throw AppError.notFound('Turma não encontrada.');
    }

    if (userRole === UserRole.PROFESSOR && classroom.course.instructorId !== userId) {
      throw AppError.forbidden('Apenas o professor responsável ou COPER podem encerrar esta turma.');
    }

    if (classroom.status === CourseStatus.FINISHED) {
      throw AppError.badRequest('Esta turma já foi encerrada anteriormente.');
    }

    // Identifica o total de datas de aula registradas na turma
    const distinctClassDates = await prisma.attendance.groupBy({
      by: ['classDate'],
      where: { classroomId },
    });

    const totalClasses = distinctClassDates.length;
    if (totalClasses === 0) {
      throw AppError.badRequest('Não é possível encerrar uma turma sem nenhuma aula/chamada registrada.');
    }

    const minPct = classroom.course.minAttendancePct;
    const minGrade = classroom.minGrade ?? 7.0;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Executa encerramento em transação atômica
    const summary = await prisma.$transaction(async (tx) => {
      // 1. Marca a turma como FINISHED
      await tx.classroom.update({
        where: { id: classroomId },
        data: { status: CourseStatus.FINISHED },
      });

      const approvedStudents = [];
      const failedStudents = [];

      // 2. Para cada aluno ativo, cruza frequência acumulada E média de avaliações (A1, A2, A3)
      for (const enrollment of classroom.enrollments) {
        const studentPresents = await tx.attendance.count({
          where: {
            classroomId,
            studentId: enrollment.studentId,
            isPresent: true,
          },
        });

        const attendancePct = Number(((studentPresents / totalClasses) * 100).toFixed(1));

        // Calcula a média final das avaliações (A1, A2, A3)
        let finalGrade = enrollment.finalGrade;
        if (
          finalGrade === null &&
          (enrollment.gradeA1 !== null || enrollment.gradeA2 !== null || enrollment.gradeA3 !== null)
        ) {
          const validGrades = [enrollment.gradeA1, enrollment.gradeA2, enrollment.gradeA3].filter(
            (g): g is number => g !== null && g !== undefined
          );
          if (validGrades.length > 0) {
            const sum = validGrades.reduce((a, b) => a + b, 0);
            finalGrade = Number((sum / validGrades.length).toFixed(1));
          }
        }

        // Regra COPER 3.0: Frequência >= frequência_mínima E Média >= média_mínima
        const meetsAttendance = attendancePct >= minPct;
        const meetsGrade = finalGrade !== null ? finalGrade >= minGrade : true;
        const isApproved = meetsAttendance && meetsGrade;

        if (isApproved) {
          // Atualiza inscrição para COMPLETED com percentual e média
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: EnrollmentStatus.COMPLETED,
              attendancePercentage: attendancePct,
              finalGrade,
            },
          });

          // Emite o certificado oficial com UUID e hash público verificador
          const certHash = uuidv4();
          const validationUrl = `${frontendUrl}/validar?code=${certHash}`;

          const certificate = await tx.certificate.create({
            data: {
              userId: enrollment.studentId,
              enrollmentId: enrollment.id,
              type: DocType.COURSE_CERTIFICATE,
              authHash: certHash,
              validationUrl,
              title: `Certificado de Conclusão - ${classroom.course.title}`,
              hours: classroom.course.workloadHours,
              description: `Conclusão com êxito no curso ${classroom.course.title} da FMP com frequência de ${attendancePct}% e média final ${
                finalGrade !== null ? finalGrade.toFixed(1) : 'Aprovado'
              }.`,
              metadata: {
                courseTitle: classroom.course.title,
                classroomCode: classroom.code,
                totalClasses,
                studentPresents,
                attendancePercentage: attendancePct,
                minAttendanceRequired: minPct,
                gradeA1: enrollment.gradeA1,
                gradeA2: enrollment.gradeA2,
                gradeA3: enrollment.gradeA3,
                finalGrade,
                minGradeRequired: minGrade,
                workloadHours: classroom.course.workloadHours,
              },
            },
          });

          approvedStudents.push({
            studentId: enrollment.studentId,
            name: enrollment.student.name,
            email: enrollment.student.email,
            attendancePct,
            finalGrade,
            certificateId: certificate.id,
            authHash: certHash,
          });
        } else {
          // Reprovado por falta ou nota insuficiente
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: EnrollmentStatus.FAILED,
              attendancePercentage: attendancePct,
              finalGrade,
            },
          });

          const reprovalReason = !meetsAttendance
            ? `Frequência insuficiente (${attendancePct}% < ${minPct}%)`
            : `Média de avaliações insuficiente (${finalGrade} < ${minGrade})`;

          failedStudents.push({
            studentId: enrollment.studentId,
            name: enrollment.student.name,
            email: enrollment.student.email,
            attendancePct,
            finalGrade,
            reason: reprovalReason,
          });
        }
      }

      return {
        totalClasses,
        totalEnrolled: classroom.enrollments.length,
        approvedCount: approvedStudents.length,
        failedCount: failedStudents.length,
        approvedStudents,
        failedStudents,
      };
    });

    // 3. Disparo de Notificações para os Alunos (Certificado Emitido ou Encerramento)
    try {
      for (const student of summary.approvedStudents) {
        // In-App Notification
        NotificationService.createNotification({
          userId: student.studentId,
          title: 'Certificado de Conclusão Disponível!',
          message: `Parabéns! Seu certificado do curso ${classroom.course.title} (${classroom.course.workloadHours}h) já foi emitido e está disponível para download.`,
          type: 'CERTIFICATE_ISSUED',
          link: `/validar?code=${student.authHash}`,
        });

        // E-mail Institucional
        if (student.email) {
          MailService.sendCourseCertificateNotification({
            userEmail: student.email,
            userName: student.name,
            courseTitle: classroom.course.title,
            workloadHours: classroom.course.workloadHours,
            authHash: student.authHash,
          }).catch((err) => {
            console.error('[CloseClassroomUseCase] Falha ao enviar e-mail de certificado:', err);
          });
        }
      }

      for (const student of summary.failedStudents) {
        NotificationService.createNotification({
          userId: student.studentId,
          title: 'Encerramento de Turma',
          message: `A turma do curso ${classroom.course.title} foi encerrada. Frequência final: ${student.attendancePct}%.`,
          type: 'COURSE_FINISHED',
          link: '/aluno/cursos',
        });
      }
    } catch (notifErr) {
      console.error('[CloseClassroomUseCase] Erro ao registrar notificações de encerramento:', notifErr);
    }

    return {
      message: 'Turma encerrada com sucesso! Frequências e notas apuradas e certificados emitidos.',
      summary,
    };
  }
}
