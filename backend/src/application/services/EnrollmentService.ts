import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { CourseStatus, EnrollmentStatus } from '../../domain/enums/index.js';
import { MailService } from '../../infrastructure/mail/MailService.js';

export interface EnrollResult {
  enrollment: {
    id: string;
    classroomId: string;
    studentId: string;
    status: EnrollmentStatus;
    waitlistPosition: number | null;
  };
  message: string;
  isWaitlist: boolean;
  position?: number;
}

export interface CancelResult {
  message: string;
  cancelledEnrollmentId: string;
  promotedStudent: {
    id: string;
    name: string;
    email: string;
    courseTitle: string;
  } | null;
}

export class EnrollmentService {
  /**
   * Realiza a inscrição de um aluno na turma com algoritmo FIFO automático.
   */
  async enroll(studentId: string, classroomId: string): Promise<EnrollResult> {
    return prisma.$transaction(async (tx) => {
      // 1. Busca a turma e verifica disponibilidade
      const classroom = await tx.classroom.findUnique({
        where: { id: classroomId },
        include: { course: true },
      });

      if (!classroom) {
        throw AppError.notFound('Turma informada não foi encontrada.');
      }

      if (classroom.status !== CourseStatus.OPEN) {
        throw AppError.badRequest('Inscrições fechadas para esta turma no momento.');
      }

      // 2. Verifica inscrição prévia do aluno
      const existing = await tx.enrollment.findUnique({
        where: {
          classroomId_studentId: {
            classroomId,
            studentId,
          },
        },
      });

      if (existing) {
        if (existing.status === EnrollmentStatus.ACTIVE) {
          throw AppError.conflict('Você já está matriculado ativamente nesta turma.');
        }
        if (existing.status === EnrollmentStatus.WAITLIST) {
          throw AppError.conflict(
            `Você já está na fila de espera desta turma na posição #${existing.waitlistPosition}.`
          );
        }
      }

      // 3. Contagem de vagas ativas (Locking lógico)
      const totalActive = await tx.enrollment.count({
        where: {
          classroomId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      // 4. Se houver vaga, garante vaga ACTIVE
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
            status: EnrollmentStatus.ACTIVE,
            waitlistPosition: null,
          },
          update: {
            status: EnrollmentStatus.ACTIVE,
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

      // 5. Turma lotada -> FIFO: calcula última posição da fila + 1
      const maxWaitlist = await tx.enrollment.aggregate({
        where: {
          classroomId,
          status: EnrollmentStatus.WAITLIST,
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
          status: EnrollmentStatus.WAITLIST,
          waitlistPosition: nextPosition,
        },
        update: {
          status: EnrollmentStatus.WAITLIST,
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

  /**
   * Cancela a vaga de um aluno e executa a promoção do próximo da fila em transação.
   */
  async cancel(enrollmentId: string, requesterId: string, isCoper = false): Promise<CancelResult> {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Busca a inscrição
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
        throw AppError.notFound('Inscrição não encontrada.');
      }

      if (!isCoper && enrollment.studentId !== requesterId) {
        throw AppError.forbidden('Você não tem permissão para cancelar a inscrição de outro aluno.');
      }

      if (enrollment.status === EnrollmentStatus.CANCELLED) {
        throw AppError.badRequest('Esta inscrição já está cancelada.');
      }

      const wasActive = enrollment.status === EnrollmentStatus.ACTIVE;
      const wasWaitlist = enrollment.status === EnrollmentStatus.WAITLIST;
      const oldPosition = enrollment.waitlistPosition;
      const classroomId = enrollment.classroomId;

      // 2. Altera status da inscrição cancelada para CANCELLED e zera a waitlistPosition
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.CANCELLED,
          waitlistPosition: null,
        },
      });

      let promoted = null;

      if (wasActive) {
        // 3. Busca o 1º aluno da fila (menor waitlistPosition)
        const nextInLine = await tx.enrollment.findFirst({
          where: {
            classroomId,
            status: EnrollmentStatus.WAITLIST,
          },
          orderBy: {
            waitlistPosition: 'asc',
          },
          include: {
            student: true,
          },
        });

        if (nextInLine) {
          // 4. Promove o 1º aluno da fila para ACTIVE e zera sua posição
          await tx.enrollment.update({
            where: { id: nextInLine.id },
            data: {
              status: EnrollmentStatus.ACTIVE,
              waitlistPosition: null,
            },
          });

          // 5. Reordena a fila decrementando em 1 a waitlistPosition de todos os demais
          await tx.enrollment.updateMany({
            where: {
              classroomId,
              status: EnrollmentStatus.WAITLIST,
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
      } else if (wasWaitlist && oldPosition) {
        // Se quem cancelou estava na fila, reordena quem estava atrás dele
        await tx.enrollment.updateMany({
          where: {
            classroomId,
            status: EnrollmentStatus.WAITLIST,
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

    // 6. Envia e-mail de notificação de vaga liberada
    if (result.promotedStudent) {
      MailService.sendWaitlistPromotionNotification(
        result.promotedStudent.email,
        result.promotedStudent.name,
        result.promotedStudent.courseTitle
      ).catch((err) => {
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
