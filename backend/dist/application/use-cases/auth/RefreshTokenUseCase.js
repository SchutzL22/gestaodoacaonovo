"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const TokenService_js_1 = require("../../../infrastructure/security/TokenService.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class RefreshTokenUseCase {
    async execute(refreshToken) {
        let payload;
        try {
            payload = TokenService_js_1.TokenService.verifyRefreshToken(refreshToken);
        }
        catch {
            throw AppError_js_1.AppError.unauthorized('Refresh token inválido ou expirado.');
        }
        const storedToken = await prisma_js_1.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            throw AppError_js_1.AppError.unauthorized('Refresh token revogado ou inexistente.');
        }
        await prisma_js_1.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        const newAccessToken = TokenService_js_1.TokenService.generateAccessToken({
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });
        const newRefreshToken = TokenService_js_1.TokenService.generateRefreshToken({
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_js_1.prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: storedToken.user.id,
                expiresAt,
            },
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
}
exports.RefreshTokenUseCase = RefreshTokenUseCase;
