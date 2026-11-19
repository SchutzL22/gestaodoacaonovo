"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomController = void 0;
const EnrollStudentUseCase_js_1 = require("../../application/use-cases/enrollments/EnrollStudentUseCase.js");
const CancelEnrollmentUseCase_js_1 = require("../../application/use-cases/enrollments/CancelEnrollmentUseCase.js");
const CloseClassroomUseCase_js_1 = require("../../application/use-cases/attendances/CloseClassroomUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
class ClassroomController {
    enrollStudentUseCase = new EnrollStudentUseCase_js_1.EnrollStudentUseCase();
    cancelEnrollmentUseCase = new CancelEnrollmentUseCase_js_1.CancelEnrollmentUseCase();
    closeClassroomUseCase = new CloseClassroomUseCase_js_1.CloseClassroomUseCase();
    create = async (req, res, next) => {
        try {
            const { courseId, code, maxCapacity, startDate, endDate, enrollmentStartDate, enrollmentEndDate, cancellationDeadline, minGrade, } = req.body;
            const course = await prisma_js_1.prisma.course.findUnique({
                where: { id: courseId },
            });
            if (!course) {
                throw AppError_js_1.AppError.notFound('Curso não encontrado para abertura de turma.');
            }
            const classroom = await prisma_js_1.prisma.classroom.create({
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
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const { status } = req.query;
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (status) {
                whereClause.status = String(status);
            }
            const [classrooms, total] = await Promise.all([
                prisma_js_1.prisma.classroom.findMany({
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
                prisma_js_1.prisma.classroom.count({ where: whereClause }),
            ]);
            const classroomsWithStats = await Promise.all(classrooms.map(async (c) => {
                const [activeCount, waitlistCount] = await Promise.all([
                    prisma_js_1.prisma.enrollment.count({ where: { classroomId: c.id, status: index_js_1.EnrollmentStatus.ACTIVE } }),
                    prisma_js_1.prisma.enrollment.count({ where: { classroomId: c.id, status: index_js_1.EnrollmentStatus.WAITLIST } }),
                ]);
                return {
                    ...c,
                    activeCount,
                    waitlistCount,
                    isFull: activeCount >= c.maxCapacity,
                };
            }));
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
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = String(req.params.id);
            const classroom = await prisma_js_1.prisma.classroom.findUnique({
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
                throw AppError_js_1.AppError.notFound('Turma não encontrada.');
            }
            const activeStudents = classroom.enrollments.filter((e) => e.status === index_js_1.EnrollmentStatus.ACTIVE);
            const waitlistStudents = classroom.enrollments.filter((e) => e.status === index_js_1.EnrollmentStatus.WAITLIST);
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
        }
        catch (error) {
            next(error);
        }
    };
    getMyTeachingClassrooms = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const teacherId = req.user.userId;
            const classrooms = await prisma_js_1.prisma.classroom.findMany({
                where: {
                    course: {
                        instructorId: teacherId,
                    },
                },
                include: {
                    course: true,
                    enrollments: {
                        where: {
                            status: { in: [index_js_1.EnrollmentStatus.ACTIVE, index_js_1.EnrollmentStatus.COMPLETED, index_js_1.EnrollmentStatus.FAILED] },
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
        }
        catch (error) {
            next(error);
        }
    };
    launchGrades = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const classroomId = String(req.params.id);
            const { grades } = req.body;
            const classroom = await prisma_js_1.prisma.classroom.findUnique({
                where: { id: classroomId },
                include: { course: true },
            });
            if (!classroom) {
                throw AppError_js_1.AppError.notFound('Turma não encontrada.');
            }
            if (req.user.role === index_js_1.UserRole.PROFESSOR &&
                classroom.course.instructorId !== req.user.userId) {
                throw AppError_js_1.AppError.forbidden('Você só pode lançar avaliações para as turmas que ministra.');
            }
            if (classroom.status === index_js_1.CourseStatus.FINISHED) {
                throw AppError_js_1.AppError.badRequest('Não é possível alterar notas de uma turma já encerrada.');
            }
            const updatedEnrollments = await prisma_js_1.prisma.$transaction(grades.map((item) => {
                const validGrades = [item.gradeA1, item.gradeA2, item.gradeA3].filter((g) => g !== null && g !== undefined && !isNaN(Number(g)));
                const finalGrade = validGrades.length > 0
                    ? Number((validGrades.reduce((sum, g) => sum + Number(g), 0) / validGrades.length).toFixed(1))
                    : null;
                return prisma_js_1.prisma.enrollment.update({
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
            }));
            res.status(200).json({
                status: 'success',
                message: `Avaliações salvas com sucesso para ${updatedEnrollments.length} alunos!`,
                data: { enrollments: updatedEnrollments },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getWaitlist = async (req, res, next) => {
        try {
            const classroomId = String(req.params.id);
            const classroom = await prisma_js_1.prisma.classroom.findUnique({
                where: { id: classroomId },
                include: {
                    course: true,
                    enrollments: {
                        where: { status: index_js_1.EnrollmentStatus.WAITLIST },
                        include: {
                            student: {
                                select: { id: true, name: true, email: true, phone: true, matricula: true },
                            },
                        },
                        orderBy: { waitlistPosition: 'asc' },
                    },
                },
            });
            if (!classroom)
                throw AppError_js_1.AppError.notFound('Turma não encontrada.');
            const activeCount = await prisma_js_1.prisma.enrollment.count({
                where: { classroomId, status: index_js_1.EnrollmentStatus.ACTIVE },
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
        }
        catch (error) {
            next(error);
        }
    };
    enroll = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const id = String(req.params.id);
            const result = await this.enrollStudentUseCase.execute(req.user.userId, id);
            res.status(200).json({
                status: 'success',
                message: result.message,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    cancel = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const id = String(req.params.id);
            const result = await this.cancelEnrollmentUseCase.execute(req.user.userId, id);
            res.status(200).json({
                status: 'success',
                message: result.message,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    close = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const id = String(req.params.id);
            const result = await this.closeClassroomUseCase.execute(id, req.user.userId, req.user.role);
            res.status(200).json({
                status: 'success',
                message: result.message,
                data: result.summary,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.ClassroomController = ClassroomController;
