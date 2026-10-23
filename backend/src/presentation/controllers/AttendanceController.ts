import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { RecordAttendanceUseCase } from '../../application/use-cases/attendances/RecordAttendanceUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole } from '../../domain/enums/index.js';

export class AttendanceController {
  private recordAttendanceUseCase = new RecordAttendanceUseCase();

  record = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await this.recordAttendanceUseCase.execute(
        req.user.userId,
        req.user.role as UserRole,
        req.body
      );

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.records,
      });
    } catch (error) {
      next(error);
    }
  };

  getByClassroom = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const classroomId = req.params.classroomId as string;

      const attendances = await prisma.attendance.findMany({
        where: { classroomId },
        include: {
          student: {
            select: { id: true, name: true, email: true, cpf: true },
          },
        },
        orderBy: [{ classDate: 'desc' }, { student: { name: 'asc' } }],
      });

      res.status(200).json({
        status: 'success',
        data: { attendances },
      });
    } catch (error) {
      next(error);
    }
  };
}
