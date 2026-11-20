"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const TokenService_js_1 = require("../../../infrastructure/security/TokenService.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class RefreshTokenUseCase {
    async execute(refreshToken) {
        try {
            TokenService_js_1.TokenService.verifyRefreshToken(refreshToken);
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
        if (!storedToken.user.isActive) {
            throw AppError_js_1.AppError.unauthorized('Conta inativa.');
        }
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
        await prisma_js_1.prisma.$transaction(async (tx) => {
            const claimed = await tx.refreshToken.updateMany({
                where: { id: storedToken.id, revoked: false, expiresAt: { gt: new Date() } },
                data: { revoked: true },
            });
            if (!claimed.count)
                throw AppError_js_1.AppError.unauthorized('Sessão expirada.');
            await tx.refreshToken.create({
                data: { token: newRefreshToken, userId: storedToken.user.id, expiresAt },
            });
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
}
exports.RefreshTokenUseCase = RefreshTokenUseCase;
