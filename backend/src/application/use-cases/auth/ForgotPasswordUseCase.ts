import crypto from 'crypto';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';

export class ForgotPasswordUseCase {
  async execute(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Por segurança, não revelamos se o e-mail existe ou não
    if (!user) {
      return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    // Invalida tokens anteriores não utilizados
    await (prisma as any).passwordResetToken?.deleteMany({
      where: { userId: user.id, usedAt: null },
    }).catch(() => {}); // Silencia se a tabela ainda não existir

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Tenta criar o token de reset (pode falhar se a migration ainda não rodou)
    try {
      await (prisma as any).passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });
    } catch {
      throw AppError.internal('Serviço de recuperação de senha temporariamente indisponível.');
    }

    // TODO: Integrar com MailService.sendPasswordResetEmail(user.email, token)
    console.log(`[ForgotPassword] Token para ${user.email}: ${token} (expira em 1h)`);

    return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }
}
