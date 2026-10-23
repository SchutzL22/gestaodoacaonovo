import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { CreateCourseInput } from '../../application/dtos/course.dto.js';

export class CourseController {
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateCourseInput = req.body;

      // Verifica se o instrutor existe e tem papel compatível
      const instructor = await prisma.user.findUnique({
        where: { id: data.instructorId },
      });

      if (!instructor) {
        throw AppError.notFound('Professor/Instrutor informado não foi encontrado.');
      }

      const course = await prisma.course.create({
        data: {
          title: data.title,
          description: data.description,
          instructorId: data.instructorId,
          workloadHours: data.workloadHours,
          minAttendancePct: data.minAttendancePct,
        },
        include: {
          instructor: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Curso cadastrado com sucesso!',
        data: { course },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          skip,
          take: limit,
          include: {
            instructor: {
              select: { id: true, name: true, email: true },
            },
            classrooms: {
              include: {
                _count: {
                  select: {
                    enrollments: { where: { status: 'ACTIVE' } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        data: {
          courses,
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
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          instructor: {
            select: { id: true, name: true, email: true },
          },
          classrooms: {
            include: {
              enrollments: {
                include: {
                  student: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!course) {
        throw AppError.notFound('Curso não encontrado.');
      }

      res.status(200).json({
        status: 'success',
        data: { course },
      });
    } catch (error) {
      next(error);
    }
  };
}
