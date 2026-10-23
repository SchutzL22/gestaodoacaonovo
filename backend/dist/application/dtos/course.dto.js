"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollClassroomSchema = exports.createClassroomSchema = exports.createCourseSchema = void 0;
const zod_1 = require("zod");
exports.createCourseSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'O título do curso deve ter no mínimo 3 caracteres'),
    description: zod_1.z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres'),
    instructorId: zod_1.z.string().uuid('ID do professor/instrutor inválido'),
    workloadHours: zod_1.z.number().int().positive('Carga horária deve ser um número inteiro positivo'),
    minAttendancePct: zod_1.z.number().min(0).max(100).default(75.0),
});
exports.createClassroomSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid('ID do curso inválido'),
    code: zod_1.z.string().optional(),
    maxCapacity: zod_1.z.number().int().positive('Capacidade máxima deve ser maior que 0'),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)),
});
exports.enrollClassroomSchema = zod_1.z.object({
    classroomId: zod_1.z.string().uuid('ID da turma inválido'),
});
