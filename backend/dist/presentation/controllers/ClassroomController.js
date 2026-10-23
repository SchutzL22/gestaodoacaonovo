"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomController = void 0;
const EnrollStudentUseCase_js_1 = require("../../application/use-cases/enrollments/EnrollStudentUseCase.js");
const CancelEnrollmentUseCase_js_1 = require("../../application/use-cases/enrollments/CancelEnrollmentUseCase.js");
const CloseClassroomUseCase_js_1 = require("../../application/use-cases/attendances/CloseClassroomUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
class ClassroomController {
    enrollStudentUseCase = new EnrollStudentUseCase_js_1.EnrollStudentUseCase();
    cancelEnrollmentUseCase = new CancelEnrollmentUseCase_js_1.CancelEnrollmentUseCase();
    closeClassroomUseCase = new CloseClassroomUseCase_js_1.CloseClassroomUseCase();
    create = async (req, res, next) => {
        try {
            const { courseId, code, maxCapacity, startDate, endDate } = req.body;
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
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const { status } = req.query;
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const skip = (page - 1) * limit;
            const whereClause = status ? { status: String(status) } : {};
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
                                certificate: true,
                            },
                        },
                    },
                    orderBy: { startDate: 'asc' },
                }),
                prisma_js_1.prisma.classroom.count({ where: whereClause }),
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
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const classroom = await prisma_js_1.prisma.classroom.findUnique({
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
                throw AppError_js_1.AppError.notFound('Turma não encontrada.');
            }
            res.status(200).json({
                status: 'success',
                data: { classroom },
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
            const id = req.params.id;
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
            const id = req.params.id;
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
            const id = req.params.id;
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
