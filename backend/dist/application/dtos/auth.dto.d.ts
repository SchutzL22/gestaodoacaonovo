import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodEffects<z.ZodString, string, string>;
    cpf: z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<{
        ALUNO: "ALUNO";
        PROFESSOR: "PROFESSOR";
        COPER: "COPER";
        EMPRESARIO: "EMPRESARIO";
        CIVIL: "CIVIL";
    }>>;
    matricula: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL";
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role?: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL" | undefined;
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}>, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL";
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role?: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL" | undefined;
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}>, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL";
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role?: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL" | undefined;
    matricula?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export declare const anonymousDonationUserSchema: z.ZodObject<{
    donorName: z.ZodString;
    donorCpf: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    donorName: string;
    donorCpf: string;
}, {
    donorName: string;
    donorCpf: string;
}>;
export type AnonymousDonationUserInput = z.infer<typeof anonymousDonationUserSchema>;
