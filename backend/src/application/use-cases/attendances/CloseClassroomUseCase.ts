import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { CourseStatus, EnrollmentStatus, DocType, UserRole } from '../../../domain/enums/index.js';

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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Executa encerramento em transação
    const summary = await prisma.$transaction(async (tx) => {
      // 1. Marca a turma como FINISHED
      await tx.classroom.update({
        where: { id: classroomId },
        data: { status: CourseStatus.FINISHED },
      });

      const approvedStudents = [];
      const failedStudents = [];

      // 2. Para cada aluno ativo, calcula % de presença
      for (const enrollment of classroom.enrollments) {
        const studentPresents = await tx.attendance.count({
          where: {
            classroomId,
            studentId: enrollment.studentId,
            isPresent: true,
          },
        });

        const attendancePct = Number(((studentPresents / totalClasses) * 100).toFixed(1));
        const isApproved = attendancePct >= minPct;

        if (isApproved) {
          // Atualiza inscrição para COMPLETED
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: EnrollmentStatus.COMPLETED,
              attendancePercentage: attendancePct,
            },
          });

          // Emite o certificado do curso com UUID e hash público
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
              description: `Conclusão do curso ${classroom.course.title} com frequência de ${attendancePct}%.`,
              metadata: {
                courseTitle: classroom.course.title,
                classroomCode: classroom.code,
                totalClasses,
                studentPresents,
                attendancePercentage: attendancePct,
                minAttendanceRequired: minPct,
                workloadHours: classroom.course.workloadHours,
              },
            },
          });

          approvedStudents.push({
            studentId: enrollment.studentId,
            name: enrollment.student.name,
            attendancePct,
            certificateId: certificate.id,
            authHash: certHash,
          });
        } else {
          // Reprovado por falta
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: EnrollmentStatus.FAILED,
              attendancePercentage: attendancePct,
            },
          });

          failedStudents.push({
            studentId: enrollment.studentId,
            name: enrollment.student.name,
            attendancePct,
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

    return {
      message: 'Turma encerrada com sucesso! Frequências apuradas e certificados emitidos.',
      summary,
    };
  }
}
