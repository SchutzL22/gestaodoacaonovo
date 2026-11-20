import { createHash } from 'node:crypto';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import { AppError } from '../../../domain/errors/AppError.js';

export class ResetPasswordUseCase {
  async execute(token: string, newPassword: string) {
    const invalid = () => AppError.badRequest('Código de recuperação inválido ou expirado.');
    if (!/^[a-f0-9]{64}$/.test(token)) throw invalid();
    const tokenHash = 'sha256:' + createHash('sha256').update(token).digest('hex');
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { token: { in: [tokenHash, token] } },
    });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) throw invalid();
    const passwordHash = await PasswordHasher.hash(newPassword);

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (!claimed.count) throw invalid();
      await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });

      // Revoga todos os refresh tokens do usuário por segurança
      await tx.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revoked: true },
      });
    });

    return { message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' };
  }
}
