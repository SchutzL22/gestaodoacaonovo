import crypto from 'crypto';
import { prisma } from '../../../infrastructure/database/prisma.js';
import { AppError } from '../../../domain/errors/AppError.js';

import { MailService } from '../../../infrastructure/mail/MailService.js';

export class ForgotPasswordUseCase {
  async execute(email: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your_smtp_user_here') {
      throw new AppError('Envio de e-mail indisponível. Contate a COPER para recuperar o acesso.', 503);
    }
    const user = await prisma.user.findUnique({ where: { email } });

    // Por segurança, não revelamos se o e-mail existe ou não
    if (!user) {
      return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = 'sha256:' + crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({ data: { token: tokenHash, userId: user.id, expiresAt } }),
    ]);

    await MailService.sendPasswordResetCode(user.email, token);
    return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }
}
