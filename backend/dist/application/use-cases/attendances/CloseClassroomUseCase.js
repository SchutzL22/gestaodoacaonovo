"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseClassroomUseCase = void 0;
const uuid_1 = require("uuid");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const index_js_1 = require("../../../domain/enums/index.js");
const MailService_js_1 = require("../../../infrastructure/mail/MailService.js");
const NotificationService_js_1 = require("../../services/NotificationService.js");
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
        const minGrade = classroom.minGrade ?? 7.0;
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
                let finalGrade = enrollment.finalGrade;
                if (finalGrade === null &&
                    (enrollment.gradeA1 !== null || enrollment.gradeA2 !== null || enrollment.gradeA3 !== null)) {
                    const validGrades = [enrollment.gradeA1, enrollment.gradeA2, enrollment.gradeA3].filter((g) => g !== null && g !== undefined);
                    if (validGrades.length > 0) {
                        const sum = validGrades.reduce((a, b) => a + b, 0);
                        finalGrade = Number((sum / validGrades.length).toFixed(1));
                    }
                }
                const meetsAttendance = attendancePct >= minPct;
                const meetsGrade = finalGrade !== null ? finalGrade >= minGrade : true;
                const isApproved = meetsAttendance && meetsGrade;
                if (isApproved) {
                    await tx.enrollment.update({
                        where: { id: enrollment.id },
                        data: {
                            status: index_js_1.EnrollmentStatus.COMPLETED,
                            attendancePercentage: attendancePct,
                            finalGrade,
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
                            description: `Conclusão com êxito no curso ${classroom.course.title} da FMP com frequência de ${attendancePct}% e média final ${finalGrade !== null ? finalGrade.toFixed(1) : 'Aprovado'}.`,
                            metadata: {
                                courseTitle: classroom.course.title,
                                classroomCode: classroom.code,
                                totalClasses,
                                studentPresents,
                                attendancePercentage: attendancePct,
                                minAttendanceRequired: minPct,
                                gradeA1: enrollment.gradeA1,
                                gradeA2: enrollment.gradeA2,
                                gradeA3: enrollment.gradeA3,
                                finalGrade,
                                minGradeRequired: minGrade,
                                workloadHours: classroom.course.workloadHours,
                            },
                        },
                    });
                    approvedStudents.push({
                        studentId: enrollment.studentId,
                        name: enrollment.student.name,
                        email: enrollment.student.email,
                        attendancePct,
                        finalGrade,
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
                            finalGrade,
                        },
                    });
                    const reprovalReason = !meetsAttendance
                        ? `Frequência insuficiente (${attendancePct}% < ${minPct}%)`
                        : `Média de avaliações insuficiente (${finalGrade} < ${minGrade})`;
                    failedStudents.push({
                        studentId: enrollment.studentId,
                        name: enrollment.student.name,
                        email: enrollment.student.email,
                        attendancePct,
                        finalGrade,
                        reason: reprovalReason,
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
        try {
            for (const student of summary.approvedStudents) {
                NotificationService_js_1.NotificationService.createNotification({
                    userId: student.studentId,
                    title: 'Certificado de Conclusão Disponível!',
                    message: `Parabéns! Seu certificado do curso ${classroom.course.title} (${classroom.course.workloadHours}h) já foi emitido e está disponível para download.`,
                    type: 'CERTIFICATE_ISSUED',
                    link: `/validar?code=${student.authHash}`,
                });
                if (student.email) {
                    MailService_js_1.MailService.sendCourseCertificateNotification({
                        userEmail: student.email,
                        userName: student.name,
                        courseTitle: classroom.course.title,
                        workloadHours: classroom.course.workloadHours,
                        authHash: student.authHash,
                    }).catch((err) => {
                        console.error('[CloseClassroomUseCase] Falha ao enviar e-mail de certificado:', err);
                    });
                }
            }
            for (const student of summary.failedStudents) {
                NotificationService_js_1.NotificationService.createNotification({
                    userId: student.studentId,
                    title: 'Encerramento de Turma',
                    message: `A turma do curso ${classroom.course.title} foi encerrada. Frequência final: ${student.attendancePct}%.`,
                    type: 'COURSE_FINISHED',
                    link: '/aluno/cursos',
                });
            }
        }
        catch (notifErr) {
            console.error('[CloseClassroomUseCase] Erro ao registrar notificações de encerramento:', notifErr);
        }
        return {
            message: 'Turma encerrada com sucesso! Frequências e notas apuradas e certificados emitidos.',
            summary,
        };
    }
}
exports.CloseClassroomUseCase = CloseClassroomUseCase;
