"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const PasswordHasher_js_1 = require("../../../infrastructure/security/PasswordHasher.js");
const TokenService_js_1 = require("../../../infrastructure/security/TokenService.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class LoginUseCase {
    async execute(data) {
        const rawEmail = (data.email || '').trim().toLowerCase();
        const user = await prisma_js_1.prisma.user.findUnique({ where: { email: rawEmail } });
        if (!user) {
            throw AppError_js_1.AppError.unauthorized('Credenciais inválidas. Verifique seu e-mail e senha.');
        }
        const isPasswordValid = await PasswordHasher_js_1.PasswordHasher.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw AppError_js_1.AppError.unauthorized('Credenciais inválidas. Verifique seu e-mail e senha.');
        }
        if (!user.isActive) {
            throw AppError_js_1.AppError.forbidden('Conta inativa. Entre em contato com a COPER.');
        }
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
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                cpf: user.cpf,
                matricula: user.matricula,
                role: user.role,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken: refreshTokenString,
        };
    }
}
exports.LoginUseCase = LoginUseCase;
