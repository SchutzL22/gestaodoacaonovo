import { z } from 'zod';
import { Role } from '../../domain/enums/index.js';

export const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail institucional ou pessoal inválido'),
  cpf: z
    .string()
    .min(11, 'CPF deve conter no mínimo 11 dígitos')
    .max(14, 'CPF inválido')
    .transform((val) => val.replace(/\D/g, '')),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
  role: z.nativeEnum(Role).default(Role.ALUNO),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
