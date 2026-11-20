"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordUseCase = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
const MailService_js_1 = require("../../../infrastructure/mail/MailService.js");
class ForgotPasswordUseCase {
    async execute(email) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS || process.env.SMTP_USER === 'your_smtp_user_here') {
            throw new AppError_js_1.AppError('Envio de e-mail indisponível. Contate a COPER para recuperar o acesso.', 503);
        }
        const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const tokenHash = 'sha256:' + crypto_1.default.createHash('sha256').update(token).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
            prisma_js_1.prisma.passwordResetToken.create({ data: { token: tokenHash, userId: user.id, expiresAt } }),
        ]);
        await MailService_js_1.MailService.sendPasswordResetCode(user.email, token);
        return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }
}
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
