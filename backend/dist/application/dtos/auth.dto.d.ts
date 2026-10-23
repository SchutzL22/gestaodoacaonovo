import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    cpf: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodNativeEnum<{
        ALUNO: "ALUNO";
        PROFESSOR: "PROFESSOR";
        COPER: "COPER";
        EMPRESARIO: "EMPRESARIO";
        CIVIL: "CIVIL";
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL";
}, {
    name: string;
    email: string;
    cpf: string;
    password: string;
    role?: "ALUNO" | "PROFESSOR" | "COPER" | "EMPRESARIO" | "CIVIL" | undefined;
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
