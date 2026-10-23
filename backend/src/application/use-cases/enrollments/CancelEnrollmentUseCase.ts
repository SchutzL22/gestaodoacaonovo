import { EnrollmentService } from '../../services/EnrollmentService.js';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';

export class CancelEnrollmentUseCase {
  private service = new EnrollmentService();

  async execute(studentId: string, classroomId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        classroomId_studentId: {
          classroomId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw AppError.notFound('Inscrição não encontrada para esta turma.');
    }

    return this.service.cancel(enrollment.id, studentId);
  }
}
