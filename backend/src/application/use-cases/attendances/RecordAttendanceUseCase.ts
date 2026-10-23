import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { RecordAttendanceInput } from '../../dtos/attendance.dto.js';
import { CourseStatus, UserRole } from '../../../domain/enums/index.js';

export class RecordAttendanceUseCase {
  async execute(teacherId: string, userRole: UserRole, data: RecordAttendanceInput) {
    const classroom = await prisma.classroom.findUnique({
      where: { id: data.classroomId },
      include: { course: true },
    });

    if (!classroom) {
      throw AppError.notFound('Turma não encontrada.');
    }

    // Apenas o professor responsável ou COPER podem fazer a chamada
    if (userRole === UserRole.PROFESSOR && classroom.course.instructorId !== teacherId) {
      throw AppError.forbidden('Você não é o professor responsável por esta turma.');
    }

    if (classroom.status === CourseStatus.FINISHED) {
      throw AppError.badRequest('Não é possível alterar frequências de uma turma já encerrada.');
    }

    // Se estiver OPEN, muda para IN_PROGRESS na primeira chamada
    if (classroom.status === CourseStatus.OPEN) {
      await prisma.classroom.update({
        where: { id: classroom.id },
        data: { status: CourseStatus.IN_PROGRESS },
      });
    }

    // Upsert em massa de presenças para a data
    const records = await prisma.$transaction(
      data.records.map((item) =>
        prisma.attendance.upsert({
          where: {
            classroomId_studentId_classDate: {
              classroomId: data.classroomId,
              studentId: item.studentId,
              classDate: data.classDate,
            },
          },
          create: {
            classroomId: data.classroomId,
            studentId: item.studentId,
            classDate: data.classDate,
            isPresent: item.isPresent,
            notes: item.notes,
          },
          update: {
            isPresent: item.isPresent,
            notes: item.notes,
          },
        })
      )
    );

    return {
      message: `Chamada registrada com sucesso para ${records.length} alunos na data informada.`,
      records,
    };
  }
}
