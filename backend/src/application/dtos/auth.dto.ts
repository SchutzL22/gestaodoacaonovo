import { z } from 'zod';
import { Role } from '../../domain/enums/index.js';

// Validação de e-mail por perfil
const alunoEmailPattern = /^[a-zA-Z0-9._%+-]+@aluno\.(fmpsc\.edu\.br|coper\.edu\.br)$/;
const institucionalEmailPattern = /^[a-zA-Z0-9._%+-]+@(fmpsc\.edu\.br|coper\.edu\.br)$/;

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().trim().toLowerCase().email('E-mail inválido')
    .refine(email => !email.endsWith('@coper.invalid'), 'Domínio reservado.'),
  cpf: z
    .string()
    .min(11, 'CPF deve conter no mínimo 11 dígitos')
    .max(14, 'CPF inválido')
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres'),
  role: z.nativeEnum(Role).default(Role.ALUNO),
  matricula: z.string().trim().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => {
  // ALUNO: obrigatório e-mail @aluno.fmpsc.edu.br ou @aluno.coper.edu.br
  if (data.role === Role.ALUNO) {
    return alunoEmailPattern.test(data.email);
  }
  // PROFESSOR/COPER: e-mail institucional
  if (data.role === Role.PROFESSOR || data.role === Role.COPER) {
    return institucionalEmailPattern.test(data.email);
  }
  // CIVIL/EMPRESARIO: qualquer e-mail válido
  return true;
}, {
  message: 'E-mail não corresponde ao domínio exigido para o perfil selecionado. ALUNO: @aluno.fmpsc.edu.br ou @aluno.coper.edu.br | PROFESSOR/COPER: @fmpsc.edu.br ou @coper.edu.br',
  path: ['email'],
}).refine((data) => {
  // ALUNO: matrícula obrigatória
  if (data.role === Role.ALUNO) {
    return Boolean(data.matricula && data.matricula.trim().length >= 3);
  }
  return true;
}, {
  message: 'Matrícula é obrigatória para o perfil ALUNO (mínimo 3 caracteres).',
  path: ['matricula'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'A nova senha deve conter no mínimo 6 caracteres'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Schema para doação sem login (CIVIL anônimo)
export const anonymousDonationUserSchema = z.object({
  donorName: z.string().min(3, 'Nome do doador é obrigatório'),
  donorCpf: z.string().min(11).max(14).transform((v) => v.replace(/\D/g, '')),
});

export type AnonymousDonationUserInput = z.infer<typeof anonymousDonationUserSchema>;
