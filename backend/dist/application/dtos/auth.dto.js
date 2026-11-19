"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anonymousDonationUserSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../../domain/enums/index.js");
const alunoEmailPattern = /^[a-zA-Z0-9._%+-]+@aluno\.(fmpsc\.edu\.br|coper\.edu\.br)$/;
const institucionalEmailPattern = /^[a-zA-Z0-9._%+-]+@(fmpsc\.edu\.br|coper\.edu\.br)$/;
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    email: zod_1.z.string().email('E-mail inválido'),
    cpf: zod_1.z
        .string()
        .min(11, 'CPF deve conter no mínimo 11 dígitos')
        .max(14, 'CPF inválido')
        .transform((val) => val.replace(/\D/g, '')),
    password: zod_1.z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
    role: zod_1.z.nativeEnum(index_js_1.Role).default(index_js_1.Role.ALUNO),
    matricula: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
}).refine((data) => {
    if (data.role === index_js_1.Role.ALUNO) {
        return alunoEmailPattern.test(data.email);
    }
    if (data.role === index_js_1.Role.PROFESSOR || data.role === index_js_1.Role.COPER) {
        return institucionalEmailPattern.test(data.email);
    }
    return true;
}, {
    message: 'E-mail não corresponde ao domínio exigido para o perfil selecionado. ALUNO: @aluno.fmpsc.edu.br ou @aluno.coper.edu.br | PROFESSOR/COPER: @fmpsc.edu.br ou @coper.edu.br',
    path: ['email'],
}).refine((data) => {
    if (data.role === index_js_1.Role.ALUNO) {
        return Boolean(data.matricula && data.matricula.trim().length >= 3);
    }
    return true;
}, {
    message: 'Matrícula é obrigatória para o perfil ALUNO (mínimo 3 caracteres).',
    path: ['matricula'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(1, 'A senha é obrigatória'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token é obrigatório'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token é obrigatório'),
    password: zod_1.z.string().min(6, 'A nova senha deve conter no mínimo 6 caracteres'),
});
exports.anonymousDonationUserSchema = zod_1.z.object({
    donorName: zod_1.z.string().min(3, 'Nome do doador é obrigatório'),
    donorCpf: zod_1.z.string().min(11).max(14).transform((v) => v.replace(/\D/g, '')),
});
