"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentController = void 0;
const EnrollmentService_js_1 = require("../../application/services/EnrollmentService.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
class EnrollmentController {
    service = new EnrollmentService_js_1.EnrollmentService();
    enroll = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const { classroomId } = req.body;
            if (!classroomId) {
                throw AppError_js_1.AppError.badRequest('O ID da turma (classroomId) é obrigatório.');
            }
            const result = await this.service.enroll(req.user.userId, classroomId);
            res.status(result.isWaitlist ? 202 : 201).json({
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
            const isCoper = req.user.role === index_js_1.UserRole.COPER;
            const result = await this.service.cancel(id, req.user.userId, isCoper);
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
    myEnrollments = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const enrollments = await prisma_js_1.prisma.enrollment.findMany({
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
            const enrollmentsWithStats = await Promise.all(enrollments.map(async (e) => {
                const [totalClasses, studentPresents] = await Promise.all([
                    prisma_js_1.prisma.attendance.groupBy({
                        by: ['classDate'],
                        where: { classroomId: e.classroomId },
                    }),
                    prisma_js_1.prisma.attendance.count({
                        where: { classroomId: e.classroomId, studentId: req.user.userId, isPresent: true },
                    }),
                ]);
                const totalCount = totalClasses.length;
                const computedPct = totalCount > 0 ? Number(((studentPresents / totalCount) * 100).toFixed(1)) : 100;
                return {
                    ...e,
                    totalClasses: totalCount,
                    studentPresents,
                    computedAttendancePercentage: e.attendancePercentage ?? computedPct,
                };
            }));
            res.status(200).json({
                status: 'success',
                data: { enrollments: enrollmentsWithStats },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.EnrollmentController = EnrollmentController;
