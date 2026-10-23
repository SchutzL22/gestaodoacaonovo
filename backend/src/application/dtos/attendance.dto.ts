import { z } from 'zod';

export const attendanceItemSchema = z.object({
  studentId: z.string().uuid('ID do aluno inválido'),
  isPresent: z.boolean(),
  notes: z.string().optional(),
});

export const recordAttendanceSchema = z.object({
  classroomId: z.string().uuid('ID da turma inválido'),
  classDate: z.string().transform((val) => new Date(val)),
  records: z.array(attendanceItemSchema).min(1, 'Pelo menos um registro de presença é obrigatório'),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
