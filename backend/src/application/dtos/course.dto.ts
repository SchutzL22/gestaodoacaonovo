import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'O título do curso deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
  instructorId: z.string().uuid('ID do professor/instrutor inválido'),
  workloadHours: z.number().int().positive('Carga horária deve ser um número inteiro positivo'),
  minAttendancePct: z.number().min(0).max(100).default(75.0),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const createClassroomSchema = z.object({
  courseId: z.string().uuid('ID do curso inválido'),
  code: z.string().optional(),
  maxCapacity: z.number().int().positive('Capacidade máxima deve ser maior que 0'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;

export const enrollClassroomSchema = z.object({
  classroomId: z.string().uuid('ID da turma inválido'),
});

export type EnrollClassroomInput = z.infer<typeof enrollClassroomSchema>;
