"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentService = void 0;
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
const MailService_js_1 = require("../../infrastructure/mail/MailService.js");
class EnrollmentService {
    async enroll(studentId, classroomId) {
        return prisma_js_1.prisma.$transaction(async (tx) => {
            const classroom = await tx.classroom.findUnique({
                where: { id: classroomId },
                include: { course: true },
            });
            if (!classroom) {
                throw AppError_js_1.AppError.notFound('Turma informada não foi encontrada.');
            }
            if (classroom.status !== index_js_1.CourseStatus.OPEN) {
                throw AppError_js_1.AppError.badRequest('Inscrições fechadas para esta turma no momento.');
            }
            const existing = await tx.enrollment.findUnique({
                where: {
                    classroomId_studentId: {
                        classroomId,
                        studentId,
                    },
                },
            });
            if (existing) {
                if (existing.status === index_js_1.EnrollmentStatus.ACTIVE) {
                    throw AppError_js_1.AppError.conflict('Você já está matriculado ativamente nesta turma.');
                }
                if (existing.status === index_js_1.EnrollmentStatus.WAITLIST) {
                    throw AppError_js_1.AppError.conflict(`Você já está na fila de espera desta turma na posição #${existing.waitlistPosition}.`);
                }
            }
            const totalActive = await tx.enrollment.count({
                where: {
                    classroomId,
                    status: index_js_1.EnrollmentStatus.ACTIVE,
                },
            });
            if (totalActive < classroom.maxCapacity) {
                const enrollment = await tx.enrollment.upsert({
                    where: {
                        classroomId_studentId: {
                            classroomId,
                            studentId,
                        },
                    },
                    create: {
                        classroomId,
                        studentId,
                        status: index_js_1.EnrollmentStatus.ACTIVE,
                        waitlistPosition: null,
                    },
                    update: {
                        status: index_js_1.EnrollmentStatus.ACTIVE,
                        waitlistPosition: null,
                        enrolledAt: new Date(),
                    },
                });
                return {
                    enrollment: {
                        id: enrollment.id,
                        classroomId: enrollment.classroomId,
                        studentId: enrollment.studentId,
                        status: enrollment.status,
                        waitlistPosition: enrollment.waitlistPosition,
                    },
                    message: 'Inscrição confirmada com sucesso! Vaga garantida na turma.',
                    isWaitlist: false,
                };
            }
            const maxWaitlist = await tx.enrollment.aggregate({
                where: {
                    classroomId,
                    status: index_js_1.EnrollmentStatus.WAITLIST,
                },
                _max: {
                    waitlistPosition: true,
                },
            });
            const nextPosition = (maxWaitlist._max.waitlistPosition || 0) + 1;
            const enrollment = await tx.enrollment.upsert({
                where: {
                    classroomId_studentId: {
                        classroomId,
                        studentId,
                    },
                },
                create: {
                    classroomId,
                    studentId,
                    status: index_js_1.EnrollmentStatus.WAITLIST,
                    waitlistPosition: nextPosition,
                },
                update: {
                    status: index_js_1.EnrollmentStatus.WAITLIST,
                    waitlistPosition: nextPosition,
                    enrolledAt: new Date(),
                },
            });
            return {
                enrollment: {
                    id: enrollment.id,
                    classroomId: enrollment.classroomId,
                    studentId: enrollment.studentId,
                    status: enrollment.status,
                    waitlistPosition: enrollment.waitlistPosition,
                },
                message: `Turma lotada! Você foi adicionado à fila de espera na posição #${nextPosition}.`,
                isWaitlist: true,
                position: nextPosition,
            };
        });
    }
    async cancel(enrollmentId, requesterId, isCoper = false) {
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            const enrollment = await tx.enrollment.findUnique({
                where: { id: enrollmentId },
                include: {
                    classroom: {
                        include: { course: true },
                    },
                    student: true,
                },
            });
            if (!enrollment) {
                throw AppError_js_1.AppError.notFound('Inscrição não encontrada.');
            }
            if (!isCoper && enrollment.studentId !== requesterId) {
                throw AppError_js_1.AppError.forbidden('Você não tem permissão para cancelar a inscrição de outro aluno.');
            }
            if (enrollment.status === index_js_1.EnrollmentStatus.CANCELLED) {
                throw AppError_js_1.AppError.badRequest('Esta inscrição já está cancelada.');
            }
            const wasActive = enrollment.status === index_js_1.EnrollmentStatus.ACTIVE;
            const wasWaitlist = enrollment.status === index_js_1.EnrollmentStatus.WAITLIST;
            const oldPosition = enrollment.waitlistPosition;
            const classroomId = enrollment.classroomId;
            await tx.enrollment.update({
                where: { id: enrollment.id },
                data: {
                    status: index_js_1.EnrollmentStatus.CANCELLED,
                    waitlistPosition: null,
                },
            });
            let promoted = null;
            if (wasActive) {
                const nextInLine = await tx.enrollment.findFirst({
                    where: {
                        classroomId,
                        status: index_js_1.EnrollmentStatus.WAITLIST,
                    },
                    orderBy: {
                        waitlistPosition: 'asc',
                    },
                    include: {
                        student: true,
                    },
                });
                if (nextInLine) {
                    await tx.enrollment.update({
                        where: { id: nextInLine.id },
                        data: {
                            status: index_js_1.EnrollmentStatus.ACTIVE,
                            waitlistPosition: null,
                        },
                    });
                    await tx.enrollment.updateMany({
                        where: {
                            classroomId,
                            status: index_js_1.EnrollmentStatus.WAITLIST,
                            waitlistPosition: { gt: nextInLine.waitlistPosition ?? 1 },
                        },
                        data: {
                            waitlistPosition: {
                                decrement: 1,
                            },
                        },
                    });
                    promoted = {
                        id: nextInLine.student.id,
                        name: nextInLine.student.name,
                        email: nextInLine.student.email,
                        courseTitle: enrollment.classroom.course.title,
                    };
                }
            }
            else if (wasWaitlist && oldPosition) {
                await tx.enrollment.updateMany({
                    where: {
                        classroomId,
                        status: index_js_1.EnrollmentStatus.WAITLIST,
                        waitlistPosition: { gt: oldPosition },
                    },
                    data: {
                        waitlistPosition: {
                            decrement: 1,
                        },
                    },
                });
            }
            return {
                cancelledEnrollmentId: enrollment.id,
                promotedStudent: promoted,
            };
        });
        if (result.promotedStudent) {
            MailService_js_1.MailService.sendWaitlistPromotionNotification(result.promotedStudent.email, result.promotedStudent.name, result.promotedStudent.courseTitle).catch((err) => {
                console.error('[EnrollmentService] Falha ao enviar e-mail de notificação da fila:', err);
            });
        }
        return {
            message: 'Inscrição cancelada com sucesso.',
            cancelledEnrollmentId: result.cancelledEnrollmentId,
            promotedStudent: result.promotedStudent,
        };
    }
}
exports.EnrollmentService = EnrollmentService;
