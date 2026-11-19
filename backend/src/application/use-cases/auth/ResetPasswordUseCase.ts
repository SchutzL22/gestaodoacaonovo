import { prisma } from '../../../infrastructure/database/prisma.js';
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import { AppError } from '../../../domain/errors/AppError.js';

export class ResetPasswordUseCase {
  async execute(token: string, newPassword: string) {
    let resetToken: any;
    try {
      resetToken = await (prisma as any).passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });
    } catch {
      throw AppError.badRequest('Token de recuperação inválido ou expirado.');
    }

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw AppError.badRequest('Token de recuperação inválido ou expirado.');
    }

    const passwordHash = await PasswordHasher.hash(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.user.id },
        data: { passwordHash },
      });

      await (tx as any).passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      // Revoga todos os refresh tokens do usuário por segurança
      await tx.refreshToken.updateMany({
        where: { userId: resetToken.user.id },
        data: { revoked: true },
      });
    });

    return { message: 'Senha redefinida com sucesso. Faça login com sua nova senha.' };
  }
}
