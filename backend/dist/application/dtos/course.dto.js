"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchClassroomGradesSchema = exports.studentGradeItemSchema = exports.enrollClassroomSchema = exports.createClassroomSchema = exports.createCourseSchema = void 0;
const zod_1 = require("zod");
exports.createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'O título do curso deve ter no mínimo 3 caracteres'),
    description: zod_1.z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
    instructorId: zod_1.z.string().uuid('ID do professor/instrutor inválido'),
    workloadHours: zod_1.z.coerce.number().int().positive('Carga horária deve ser um número inteiro positivo'),
    minAttendancePct: zod_1.z.coerce.number().min(0).max(100).default(75.0),
});
exports.createClassroomSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid('ID do curso inválido'),
    code: zod_1.z.string().optional(),
    maxCapacity: zod_1.z.coerce.number().int().positive('Capacidade máxima deve ser maior que 0'),
    startDate: zod_1.z.string().or(zod_1.z.date()),
    endDate: zod_1.z.string().or(zod_1.z.date()),
    enrollmentStartDate: zod_1.z.string().optional().nullable(),
    enrollmentEndDate: zod_1.z.string().optional().nullable(),
    cancellationDeadline: zod_1.z.string().optional().nullable(),
    minGrade: zod_1.z.coerce.number().min(0).max(10).default(7.0),
});
exports.enrollClassroomSchema = zod_1.z.object({
    classroomId: zod_1.z.string().uuid('ID da turma inválido'),
});
exports.studentGradeItemSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid('ID de inscrição inválido'),
    gradeA1: zod_1.z.coerce.number().min(0).max(10).optional().nullable(),
    gradeA2: zod_1.z.coerce.number().min(0).max(10).optional().nullable(),
    gradeA3: zod_1.z.coerce.number().min(0).max(10).optional().nullable(),
});
exports.launchClassroomGradesSchema = zod_1.z.object({
    grades: zod_1.z.array(exports.studentGradeItemSchema).min(1, 'Informe as notas de pelo menos um aluno'),
});
