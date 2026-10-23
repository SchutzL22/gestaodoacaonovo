"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const PasswordHasher_js_1 = require("../../../infrastructure/security/PasswordHasher.js");
const TokenService_js_1 = require("../../../infrastructure/security/TokenService.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class RegisterUseCase {
    async execute(data) {
        const existingEmail = await prisma_js_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingEmail) {
            throw AppError_js_1.AppError.conflict('Já existe um usuário cadastrado com este e-mail.');
        }
        const existingCpf = await prisma_js_1.prisma.user.findUnique({
            where: { cpf: data.cpf },
        });
        if (existingCpf) {
            throw AppError_js_1.AppError.conflict('Já existe um usuário cadastrado com este CPF.');
        }
        const passwordHash = await PasswordHasher_js_1.PasswordHasher.hash(data.password);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                cpf: data.cpf,
                passwordHash,
                role: data.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                role: true,
                createdAt: true,
            },
        });
        const accessToken = TokenService_js_1.TokenService.generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshTokenString = TokenService_js_1.TokenService.generateRefreshToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_js_1.prisma.refreshToken.create({
            data: {
                token: refreshTokenString,
                userId: user.id,
                expiresAt,
            },
        });
        return {
            user,
            accessToken,
            refreshToken: refreshTokenString,
        };
    }
}
exports.RegisterUseCase = RegisterUseCase;
