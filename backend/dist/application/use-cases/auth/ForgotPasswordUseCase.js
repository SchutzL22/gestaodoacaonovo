"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordUseCase = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_js_1 = require("../../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../../domain/errors/AppError.js");
class ForgotPasswordUseCase {
    async execute(email) {
        const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
        }
        await prisma_js_1.prisma.passwordResetToken?.deleteMany({
            where: { userId: user.id, usedAt: null },
        }).catch(() => { });
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        try {
            await prisma_js_1.prisma.passwordResetToken.create({
                data: { token, userId: user.id, expiresAt },
            });
        }
        catch {
            throw AppError_js_1.AppError.internal('Serviço de recuperação de senha temporariamente indisponível.');
        }
        console.log(`[ForgotPassword] Token para ${user.email}: ${token} (expira em 1h)`);
        return { message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }
}
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
