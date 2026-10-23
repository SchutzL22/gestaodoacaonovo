"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
class CourseController {
    create = async (req, res, next) => {
        try {
            const data = req.body;
            const instructor = await prisma_js_1.prisma.user.findUnique({
                where: { id: data.instructorId },
            });
            if (!instructor) {
                throw AppError_js_1.AppError.notFound('Professor/Instrutor informado não foi encontrado.');
            }
            const course = await prisma_js_1.prisma.course.create({
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
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const skip = (page - 1) * limit;
            const [courses, total] = await Promise.all([
                prisma_js_1.prisma.course.findMany({
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
                prisma_js_1.prisma.course.count(),
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
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const course = await prisma_js_1.prisma.course.findUnique({
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
                throw AppError_js_1.AppError.notFound('Curso não encontrado.');
            }
            res.status(200).json({
                status: 'success',
                data: { course },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CourseController = CourseController;
