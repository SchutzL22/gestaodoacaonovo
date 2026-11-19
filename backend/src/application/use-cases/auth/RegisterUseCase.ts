import { prisma } from '../../../infrastructure/database/prisma.js';
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import { TokenService } from '../../../infrastructure/security/TokenService.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { RegisterInput } from '../../dtos/auth.dto.js';
import { UserRole } from '../../../domain/enums/index.js';

export class RegisterUseCase {
  async execute(data: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw AppError.conflict('Já existe um usuário cadastrado com este e-mail.');
    }

    const existingCpf = await prisma.user.findUnique({
      where: { cpf: data.cpf },
    });

    if (existingCpf) {
      throw AppError.conflict('Já existe um usuário cadastrado com este CPF.');
    }

    if (data.matricula) {
      const existingMatricula = await prisma.user.findUnique({
        where: { matricula: data.matricula },
      });
      if (existingMatricula) {
        throw AppError.conflict('Já existe um usuário cadastrado com esta matrícula.');
      }
    }

    const passwordHash = await PasswordHasher.hash(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        passwordHash,
        role: data.role as UserRole,
        matricula: data.matricula || null,
        address: data.address || null,
        phone: data.phone || null,
        isActive: true,
        semesterHoursLimit: data.role === UserRole.ALUNO ? 40 : null,
        totalHoursEarned: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        matricula: true,
        address: true,
        phone: true,
        isActive: true,
        semesterHoursLimit: true,
        totalHoursEarned: true,
        createdAt: true,
      },
    });

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

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user,
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
