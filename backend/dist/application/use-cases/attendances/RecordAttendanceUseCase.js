"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordAttendanceUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
class RecordAttendanceUseCase {
    async execute(teacherId, userRole, data) {
        const classroom = await prisma_js_1.prisma.classroom.findUnique({
            where: { id: data.classroomId },
            include: { course: true },
        });
        if (!classroom) {
            throw AppError_js_1.AppError.notFound('Turma não encontrada.');
        }
        if (userRole === index_js_1.UserRole.PROFESSOR && classroom.course.instructorId !== teacherId) {
            throw AppError_js_1.AppError.forbidden('Você não é o professor responsável por esta turma.');
        }
        if (classroom.status === index_js_1.CourseStatus.FINISHED) {
            throw AppError_js_1.AppError.badRequest('Não é possível alterar frequências de uma turma já encerrada.');
        }
        if (classroom.status === index_js_1.CourseStatus.OPEN) {
            await prisma_js_1.prisma.classroom.update({
                where: { id: classroom.id },
                data: { status: index_js_1.CourseStatus.IN_PROGRESS },
            });
        }
        const records = await prisma_js_1.prisma.$transaction(data.records.map((item) => prisma_js_1.prisma.attendance.upsert({
            where: {
                classroomId_studentId_classDate: {
                    classroomId: data.classroomId,
                    studentId: item.studentId,
                    classDate: data.classDate,
                },
            },
            create: {
                classroomId: data.classroomId,
                studentId: item.studentId,
                classDate: data.classDate,
                isPresent: item.isPresent,
                notes: item.notes,
            },
            update: {
                isPresent: item.isPresent,
                notes: item.notes,
            },
        })));
        return {
            message: `Chamada registrada com sucesso para ${records.length} alunos na data informada.`,
            records,
        };
    }
}
exports.RecordAttendanceUseCase = RecordAttendanceUseCase;
