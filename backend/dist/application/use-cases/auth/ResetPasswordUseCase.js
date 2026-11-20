"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordUseCase = void 0;
const node_crypto_1 = require("node:crypto");
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const PasswordHasher_js_1 = require("../../../infrastructure/security/PasswordHasher.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class ResetPasswordUseCase {
    async execute(token, newPassword) {
        const invalid = () => AppError_js_1.AppError.badRequest('Código de recuperação inválido ou expirado.');
        if (!/^[a-f0-9]{64}$/.test(token))
            throw invalid();
        const tokenHash = 'sha256:' + (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const resetToken = await prisma_js_1.prisma.passwordResetToken.findFirst({
            where: { token: { in: [tokenHash, token] } },
        });
        if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date())
            throw invalid();
        const passwordHash = await PasswordHasher_js_1.PasswordHasher.hash(newPassword);
        await prisma_js_1.prisma.$transaction(async (tx) => {
            const claimed = await tx.passwordResetToken.updateMany({
                where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
                data: { usedAt: new Date() },
            });
            if (!claimed.count)
                throw invalid();
            await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
            await tx.refreshToken.updateMany({
                where: { userId: resetToken.userId },
                data: { revoked: true },
            });
        });
        return { message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' };
    }
}
exports.ResetPasswordUseCase = ResetPasswordUseCase;
