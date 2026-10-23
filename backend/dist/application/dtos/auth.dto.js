"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../../domain/enums/index.js");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    email: zod_1.z.string().email('E-mail institucional ou pessoal inválido'),
    cpf: zod_1.z
        .string()
        .min(11, 'CPF deve conter no mínimo 11 dígitos')
        .max(14, 'CPF inválido')
        .transform((val) => val.replace(/\D/g, '')),
    password: zod_1.z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
    role: zod_1.z.nativeEnum(index_js_1.Role).default(index_js_1.Role.ALUNO),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(1, 'A senha é obrigatória'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token é obrigatório'),
});
