import { prisma } from '../../../infrastructure/database/prisma.js';
import { TokenService } from '../../../infrastructure/security/TokenService.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { UserRole } from '../../../domain/enums/index.js';

export class RefreshTokenUseCase {
  async execute(refreshToken: string) {
    let payload;
    try {
      payload = TokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token inválido ou expirado.');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token revogado ou inexistente.');
    }

    // Revoga o refresh token usado (token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Gera novos tokens
    const newAccessToken = TokenService.generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    });

    const newRefreshToken = TokenService.generateRefreshToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
