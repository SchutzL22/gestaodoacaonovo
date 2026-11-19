import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'O título do curso deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  instructorId: z.string().uuid('ID do professor/instrutor inválido'),
  workloadHours: z.coerce.number().int().positive('Carga horária deve ser um número inteiro positivo'),
  minAttendancePct: z.coerce.number().min(0).max(100).default(75.0),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createClassroomSchema = z.object({
  courseId: z.string().uuid('ID do curso inválido'),
  code: z.string().optional(),
  maxCapacity: z.coerce.number().int().positive('Capacidade máxima deve ser maior que 0'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  enrollmentStartDate: z.string().optional().nullable(),
  enrollmentEndDate: z.string().optional().nullable(),
  cancellationDeadline: z.string().optional().nullable(),
  minGrade: z.coerce.number().min(0).max(10).default(7.0),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;

export const enrollClassroomSchema = z.object({
  classroomId: z.string().uuid('ID da turma inválido'),
});

export type EnrollClassroomInput = z.infer<typeof enrollClassroomSchema>;

// Lançamento de notas A1, A2 e A3 por aluno
export const studentGradeItemSchema = z.object({
  enrollmentId: z.string().uuid('ID de inscrição inválido'),
  gradeA1: z.coerce.number().min(0).max(10).optional().nullable(),
  gradeA2: z.coerce.number().min(0).max(10).optional().nullable(),
  gradeA3: z.coerce.number().min(0).max(10).optional().nullable(),
});

export const launchClassroomGradesSchema = z.object({
  grades: z.array(studentGradeItemSchema).min(1, 'Informe as notas de pelo menos um aluno'),
});

export type LaunchClassroomGradesInput = z.infer<typeof launchClassroomGradesSchema>;
