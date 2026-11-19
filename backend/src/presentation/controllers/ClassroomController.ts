import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { EnrollStudentUseCase } from '../../application/use-cases/enrollments/EnrollStudentUseCase.js';
import { CancelEnrollmentUseCase } from '../../application/use-cases/enrollments/CancelEnrollmentUseCase.js';
import { CloseClassroomUseCase } from '../../application/use-cases/attendances/CloseClassroomUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole, CourseStatus, EnrollmentStatus } from '../../domain/enums/index.js';

export class ClassroomController {
  private enrollStudentUseCase = new EnrollStudentUseCase();
  private cancelEnrollmentUseCase = new CancelEnrollmentUseCase();
  private closeClassroomUseCase = new CloseClassroomUseCase();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        courseId,
        code,
        maxCapacity,
        startDate,
        endDate,
        enrollmentStartDate,
        enrollmentEndDate,
        cancellationDeadline,
        minGrade,
      } = req.body;

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
          maxCapacity: Number(maxCapacity),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          enrollmentStartDate: enrollmentStartDate ? new Date(enrollmentStartDate) : null,
          enrollmentEndDate: enrollmentEndDate ? new Date(enrollmentEndDate) : null,
          cancellationDeadline: cancellationDeadline ? new Date(cancellationDeadline) : null,
          minGrade: minGrade !== undefined ? Number(minGrade) : 7.0,
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
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (status) {
        whereClause.status = String(status) as CourseStatus;
      }

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
                gradeA1: true,
                gradeA2: true,
                gradeA3: true,
                finalGrade: true,
                certificate: true,
              },
            },
          },
          orderBy: { startDate: 'asc' },
        }),
        prisma.classroom.count({ where: whereClause }),
      ]);

      // Calcula estatísticas ativas e de fila para cada turma
      const classroomsWithStats = await Promise.all(
        classrooms.map(async (c) => {
          const [activeCount, waitlistCount] = await Promise.all([
            prisma.enrollment.count({ where: { classroomId: c.id, status: EnrollmentStatus.ACTIVE } }),
            prisma.enrollment.count({ where: { classroomId: c.id, status: EnrollmentStatus.WAITLIST } }),
          ]);
          return {
            ...c,
            activeCount,
            waitlistCount,
            isFull: activeCount >= c.maxCapacity,
          };
        })
      );

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        data: {
          classrooms: classroomsWithStats,
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
      const id = String(req.params.id);

      const classroom = await prisma.classroom.findUnique({
        where: { id },
        include: {
          course: {
            include: { instructor: { select: { id: true, name: true, email: true } } },
          },
          enrollments: {
            include: {
              student: {
                select: { id: true, name: true, email: true, cpf: true, matricula: true },
              },
              certificate: true,
            },
            orderBy: [{ status: 'asc' }, { waitlistPosition: 'asc' }, { student: { name: 'asc' } }],
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

      const activeStudents = classroom.enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE);
      const waitlistStudents = classroom.enrollments.filter((e) => e.status === EnrollmentStatus.WAITLIST);

      res.status(200).json({
        status: 'success',
        data: {
          classroom: {
            ...classroom,
            activeCount: activeStudents.length,
            waitlistCount: waitlistStudents.length,
            isFull: activeStudents.length >= classroom.maxCapacity,
            totalClassesRecorded: classroom.attendances.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listagem de turmas exclusivas do PROFESSOR logado (Diário de Classe Digital)
   */
  getMyTeachingClassrooms = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const teacherId = req.user.userId;

      const classrooms = await prisma.classroom.findMany({
        where: {
          course: {
            instructorId: teacherId,
          },
        },
        include: {
          course: true,
          enrollments: {
            where: {
              status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED, EnrollmentStatus.FAILED] },
            },
            include: {
              student: {
                select: { id: true, name: true, email: true, matricula: true },
              },
            },
            orderBy: { student: { name: 'asc' } },
          },
          attendances: {
            select: { classDate: true },
            distinct: ['classDate'],
          },
        },
        orderBy: { startDate: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: {
          classrooms: classrooms.map((c) => ({
            id: c.id,
            code: c.code,
            courseTitle: c.course.title,
            courseDescription: c.course.description,
            workloadHours: c.course.workloadHours,
            minAttendancePct: c.course.minAttendancePct,
            minGrade: c.minGrade,
            status: c.status,
            startDate: c.startDate,
            endDate: c.endDate,
            totalClasses: c.attendances.length,
            students: c.enrollments.map((e) => ({
              enrollmentId: e.id,
              studentId: e.student.id,
              name: e.student.name,
              email: e.student.email,
              matricula: e.student.matricula,
              status: e.status,
              attendancePercentage: e.attendancePercentage,
              gradeA1: e.gradeA1,
              gradeA2: e.gradeA2,
              gradeA3: e.gradeA3,
              finalGrade: e.finalGrade,
            })),
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Lançamento de notas A1, A2 e A3 por turma (PROFESSOR / COPER)
   */
  launchGrades = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const classroomId = String(req.params.id);
      const { grades } = req.body;

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        include: { course: true },
      });

      if (!classroom) {
        throw AppError.notFound('Turma não encontrada.');
      }

      if (
        req.user.role === UserRole.PROFESSOR &&
        classroom.course.instructorId !== req.user.userId
      ) {
        throw AppError.forbidden('Você só pode lançar avaliações para as turmas que ministra.');
      }

      if (classroom.status === CourseStatus.FINISHED) {
        throw AppError.badRequest('Não é possível alterar notas de uma turma já encerrada.');
      }

      const updatedEnrollments = await prisma.$transaction(
        grades.map((item: any) => {
          // Calcula média aritmética simples das notas fornecidas
          const validGrades = [item.gradeA1, item.gradeA2, item.gradeA3].filter(
            (g): g is number => g !== null && g !== undefined && !isNaN(Number(g))
          );
          const finalGrade =
            validGrades.length > 0
              ? Number(
                  (
                    validGrades.reduce((sum, g) => sum + Number(g), 0) / validGrades.length
                  ).toFixed(1)
                )
              : null;

          return prisma.enrollment.update({
            where: { id: item.enrollmentId },
            data: {
              gradeA1: item.gradeA1 !== undefined ? item.gradeA1 : null,
              gradeA2: item.gradeA2 !== undefined ? item.gradeA2 : null,
              gradeA3: item.gradeA3 !== undefined ? item.gradeA3 : null,
              finalGrade,
            },
            include: {
              student: { select: { id: true, name: true } },
            },
          });
        })
      );

      res.status(200).json({
        status: 'success',
        message: `Avaliações salvas com sucesso para ${updatedEnrollments.length} alunos!`,
        data: { enrollments: updatedEnrollments },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Visualização da Fila de Espera em Tempo Real (COPER)
   */
  getWaitlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const classroomId = String(req.params.id);

      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          course: true,
          enrollments: {
            where: { status: EnrollmentStatus.WAITLIST },
            include: {
              student: {
                select: { id: true, name: true, email: true, phone: true, matricula: true },
              },
            },
            orderBy: { waitlistPosition: 'asc' },
          },
        },
      });

      if (!classroom) throw AppError.notFound('Turma não encontrada.');

      const activeCount = await prisma.enrollment.count({
        where: { classroomId, status: EnrollmentStatus.ACTIVE },
      });

      res.status(200).json({
        status: 'success',
        data: {
          classroomId: classroom.id,
          code: classroom.code,
          courseTitle: classroom.course.title,
          maxCapacity: classroom.maxCapacity,
          activeCount,
          waitlistCount: classroom.enrollments.length,
          waitlist: classroom.enrollments.map((e) => ({
            position: e.waitlistPosition,
            enrollmentId: e.id,
            studentId: e.student.id,
            name: e.student.name,
            email: e.student.email,
            phone: e.student.phone,
            matricula: e.student.matricula,
            enrolledAt: e.enrolledAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  enroll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = String(req.params.id);
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
      const id = String(req.params.id);
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
      const id = String(req.params.id);
      const result = await this.closeClassroomUseCase.execute(
        id,
        req.user.userId,
        req.user.role as UserRole
      );

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
