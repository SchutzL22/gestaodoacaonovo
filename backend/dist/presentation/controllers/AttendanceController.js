"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const RecordAttendanceUseCase_js_1 = require("../../application/use-cases/attendances/RecordAttendanceUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
class AttendanceController {
    recordAttendanceUseCase = new RecordAttendanceUseCase_js_1.RecordAttendanceUseCase();
    record = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const result = await this.recordAttendanceUseCase.execute(req.user.userId, req.user.role, req.body);
            res.status(200).json({
                status: 'success',
                message: result.message,
                data: result.records,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getByClassroom = async (req, res, next) => {
        try {
            const classroomId = req.params.classroomId;
            const attendances = await prisma_js_1.prisma.attendance.findMany({
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AttendanceController = AttendanceController;
