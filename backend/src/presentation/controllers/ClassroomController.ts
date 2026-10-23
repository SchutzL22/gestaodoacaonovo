import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { EnrollStudentUseCase } from '../../application/use-cases/enrollments/EnrollStudentUseCase.js';
import { CancelEnrollmentUseCase } from '../../application/use-cases/enrollments/CancelEnrollmentUseCase.js';
import { CloseClassroomUseCase } from '../../application/use-cases/attendances/CloseClassroomUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole, CourseStatus } from '../../domain/enums/index.js';

export class ClassroomController {
  private enrollStudentUseCase = new EnrollStudentUseCase();
  private cancelEnrollmentUseCase = new CancelEnrollmentUseCase();
  private closeClassroomUseCase = new CloseClassroomUseCase();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { courseId, code, maxCapacity, startDate, endDate } = req.body;

      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw AppError.notFound('Curso não encontrado para abertura de turma.');
      }

      const classroom = await prisma.classroom.create({
        data: {
          courseId,
          code: code || `TURMA-${Date.now().toString().slice(-4)}`,
          maxCapacity,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        include: {
          course: {
            include: { instructor: { select: { id: true, name: true, email: true } } },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Turma aberta com sucesso!',
        data: { classroom },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      const whereClause = status ? { status: String(status) as CourseStatus } : {};

      const [classrooms, total] = await Promise.all([
        prisma.classroom.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            course: {
              include: { instructor: { select: { id: true, name: true, email: true } } },
            },
            _count: {
              select: {
                enrollments: true,
                attendances: true,
              },
            },
            enrollments: {
              where: {
                studentId: req.user?.userId,
              },
              select: {
                id: true,
                status: true,
                waitlistPosition: true,
                attendancePercentage: true,
                certificate: true,
              },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        prisma.classroom.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        data: {
          classrooms,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;

      const classroom = await prisma.classroom.findUnique({
        where: { id },
        include: {
          course: {
            include: { instructor: { select: { id: true, name: true, email: true } } },
          },
          enrollments: {
            include: {
              student: {
                select: { id: true, name: true, email: true, cpf: true },
              },
              certificate: true,
            },
            orderBy: [{ status: 'asc' }, { waitlistPosition: 'asc' }],
          },
          attendances: {
            select: {
              classDate: true,
            },
            distinct: ['classDate'],
          },
        },
      });

      if (!classroom) {
        throw AppError.notFound('Turma não encontrada.');
      }

      res.status(200).json({
        status: 'success',
        data: { classroom },
      });
    } catch (error) {
      next(error);
    }
  };

  enroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params.id as string;
      const result = await this.enrollStudentUseCase.execute(req.user.userId, id);

      res.status(200).json({
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
      const result = await this.cancelEnrollmentUseCase.execute(req.user.userId, id);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  close = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params.id as string;
      const result = await this.closeClassroomUseCase.execute(id, req.user.userId, req.user.role as UserRole);

      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.summary,
      });
    } catch (error) {
      next(error);
    }
  };
}
