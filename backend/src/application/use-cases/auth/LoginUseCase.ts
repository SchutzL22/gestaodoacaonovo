import { prisma } from '../../../infrastructure/database/prisma.js';
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import { TokenService } from '../../../infrastructure/security/TokenService.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { LoginInput } from '../../dtos/auth.dto.js';
import { UserRole } from '../../../domain/enums/index.js';

export class LoginUseCase {
  async execute(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw AppError.unauthorized('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const isPasswordValid = await PasswordHasher.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    const refreshTokenString = TokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Salva novo refresh token no banco
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
