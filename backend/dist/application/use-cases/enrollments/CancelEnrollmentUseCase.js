"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelEnrollmentUseCase = void 0;
const EnrollmentService_js_1 = require("../../services/EnrollmentService.js");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class CancelEnrollmentUseCase {
    service = new EnrollmentService_js_1.EnrollmentService();
    async execute(studentId, classroomId) {
        const enrollment = await prisma_js_1.prisma.enrollment.findUnique({
            where: {
                classroomId_studentId: {
                    classroomId,
                    studentId,
                },
            },
        });
        if (!enrollment) {
            throw AppError_js_1.AppError.notFound('Inscrição não encontrada para esta turma.');
        }
        return this.service.cancel(enrollment.id, studentId);
    }
}
exports.CancelEnrollmentUseCase = CancelEnrollmentUseCase;
