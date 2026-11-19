"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordUseCase = void 0;
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const PasswordHasher_js_1 = require("../../../infrastructure/security/PasswordHasher.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class ResetPasswordUseCase {
    async execute(token, newPassword) {
        let resetToken;
        try {
            resetToken = await prisma_js_1.prisma.passwordResetToken.findUnique({
                where: { token },
                include: { user: true },
            });
        }
        catch {
            throw AppError_js_1.AppError.badRequest('Token de recuperação inválido ou expirado.');
        }
        if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
            throw AppError_js_1.AppError.badRequest('Token de recuperação inválido ou expirado.');
        }
        const passwordHash = await PasswordHasher_js_1.PasswordHasher.hash(newPassword);
        await prisma_js_1.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: resetToken.user.id },
                data: { passwordHash },
            });
            await tx.passwordResetToken.update({
                where: { token },
                data: { usedAt: new Date() },
            });
            await tx.refreshToken.updateMany({
                where: { userId: resetToken.user.id },
                data: { revoked: true },
            });
        });
        return { message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' };
    }
}
exports.ResetPasswordUseCase = ResetPasswordUseCase;
