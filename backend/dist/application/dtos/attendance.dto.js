"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAttendanceSchema = exports.attendanceItemSchema = void 0;
const zod_1 = require("zod");
exports.attendanceItemSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid('ID do aluno inválido'),
    isPresent: zod_1.z.boolean(),
    notes: zod_1.z.string().optional(),
});
exports.recordAttendanceSchema = zod_1.z.object({
    classroomId: zod_1.z.string().uuid('ID da turma inválido'),
    classDate: zod_1.z.string().transform((val) => new Date(val)),
    records: zod_1.z.array(exports.attendanceItemSchema).min(1, 'Pelo menos um registro de presença é obrigatório'),
});
