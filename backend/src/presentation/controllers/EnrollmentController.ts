import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { EnrollmentService } from '../../application/services/EnrollmentService.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole } from '../../domain/enums/index.js';
import { prisma } from '../../infrastructure/database/prisma.js';

export class EnrollmentController {
  private service = new EnrollmentService();

  enroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const { classroomId } = req.body;

      if (!classroomId) {
        throw AppError.badRequest('O ID da turma (classroomId) é obrigatório.');
      }

      const result = await this.service.enroll(req.user.userId, classroomId);

      res.status(result.isWaitlist ? 202 : 201).json({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params.id as string;
      const isCoper = req.user.role === UserRole.COPER;

      const result = await this.service.cancel(id, req.user.userId, isCoper);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  myEnrollments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();

      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.userId },
        include: {
          classroom: {
            include: {
              course: {
                include: { instructor: { select: { id: true, name: true, email: true } } },
              },
            },
          },
          certificate: true,
        },
        orderBy: { enrolledAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: { enrollments },
      });
    } catch (error) {
      next(error);
    }
  };
}
