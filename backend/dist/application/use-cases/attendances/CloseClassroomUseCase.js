"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseClassroomUseCase = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
class CloseClassroomUseCase {
    async execute(classroomId, userId, userRole) {
        const classroom = await prisma_js_1.prisma.classroom.findUnique({
            where: { id: classroomId },
            include: {
                course: true,
                enrollments: {
                    where: { status: index_js_1.EnrollmentStatus.ACTIVE },
                    include: { student: true },
                },
            },
        });
        if (!classroom) {
            throw AppError_js_1.AppError.notFound('Turma não encontrada.');
        }
        if (userRole === index_js_1.UserRole.PROFESSOR && classroom.course.instructorId !== userId) {
            throw AppError_js_1.AppError.forbidden('Apenas o professor responsável ou COPER podem encerrar esta turma.');
        }
        if (classroom.status === index_js_1.CourseStatus.FINISHED) {
            throw AppError_js_1.AppError.badRequest('Esta turma já foi encerrada anteriormente.');
        }
        const distinctClassDates = await prisma_js_1.prisma.attendance.groupBy({
            by: ['classDate'],
            where: { classroomId },
        });
        const totalClasses = distinctClassDates.length;
        if (totalClasses === 0) {
            throw AppError_js_1.AppError.badRequest('Não é possível encerrar uma turma sem nenhuma aula/chamada registrada.');
        }
        const minPct = classroom.course.minAttendancePct;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const summary = await prisma_js_1.prisma.$transaction(async (tx) => {
            await tx.classroom.update({
                where: { id: classroomId },
                data: { status: index_js_1.CourseStatus.FINISHED },
            });
            const approvedStudents = [];
            const failedStudents = [];
            for (const enrollment of classroom.enrollments) {
                const studentPresents = await tx.attendance.count({
                    where: {
                        classroomId,
                        studentId: enrollment.studentId,
                        isPresent: true,
                    },
                });
                const attendancePct = Number(((studentPresents / totalClasses) * 100).toFixed(1));
                const isApproved = attendancePct >= minPct;
                if (isApproved) {
                    await tx.enrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: index_js_1.EnrollmentStatus.COMPLETED,
                            attendancePercentage: attendancePct,
                        },
                    });
                    const certHash = (0, uuid_1.v4)();
                    const validationUrl = `${frontendUrl}/validar?code=${certHash}`;
                    const certificate = await tx.certificate.create({
                        data: {
                            userId: enrollment.studentId,
                            enrollmentId: enrollment.id,
                            type: index_js_1.DocType.COURSE_CERTIFICATE,
                            authHash: certHash,
                            validationUrl,
                            title: `Certificado de Conclusão - ${classroom.course.title}`,
                            hours: classroom.course.workloadHours,
                            description: `Conclusão do curso ${classroom.course.title} com frequência de ${attendancePct}%.`,
                            metadata: {
                                courseTitle: classroom.course.title,
                                classroomCode: classroom.code,
                                totalClasses,
                                studentPresents,
                                attendancePercentage: attendancePct,
                                minAttendanceRequired: minPct,
                                workloadHours: classroom.course.workloadHours,
                            },
                        },
                    });
                    approvedStudents.push({
                        studentId: enrollment.studentId,
                        name: enrollment.student.name,
                        attendancePct,
                        certificateId: certificate.id,
                        authHash: certHash,
                    });
                }
                else {
                    await tx.enrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: index_js_1.EnrollmentStatus.FAILED,
                            attendancePercentage: attendancePct,
                        },
                    });
                    failedStudents.push({
                        studentId: enrollment.studentId,
                        name: enrollment.student.name,
                        attendancePct,
                    });
                }
            }
            return {
                totalClasses,
                totalEnrolled: classroom.enrollments.length,
                approvedCount: approvedStudents.length,
                failedCount: failedStudents.length,
                approvedStudents,
                failedStudents,
            };
        });
        return {
            message: 'Turma encerrada com sucesso! Frequências apuradas e certificados emitidos.',
            summary,
        };
    }
}
exports.CloseClassroomUseCase = CloseClassroomUseCase;
