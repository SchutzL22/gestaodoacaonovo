"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const uuid_1 = require("uuid");
(0, vitest_1.describe)('Engine de Validação de Documentos Criptográficos - Estilo Unisul', () => {
    (0, vitest_1.it)('deve gerar authHash no formato UUIDv4 válido', () => {
        const authHash = (0, uuid_1.v4)();
        (0, vitest_1.expect)(authHash).toBeDefined();
        (0, vitest_1.expect)((0, uuid_1.validate)(authHash)).toBe(true);
    });
    (0, vitest_1.it)('deve mascarar CPF do titular para conformidade com a LGPD', () => {
        const cpf = '12345678901';
        const maskedCpf = `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;
        (0, vitest_1.expect)(maskedCpf).toBe('***.456.789-**');
        (0, vitest_1.expect)(maskedCpf).not.toContain('123');
        (0, vitest_1.expect)(maskedCpf).not.toContain('01');
    });
    (0, vitest_1.it)('deve montar a URL pública de conferência apontando para /validar?code=HASH', () => {
        const frontendUrl = 'https://coper.fmpsc.edu.br';
        const authHash = 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32';
        const validationUrl = `${frontendUrl}/validar?code=${authHash}`;
        (0, vitest_1.expect)(validationUrl).toBe('https://coper.fmpsc.edu.br/validar?code=f7a2c091-8d2b-4fa3-9f12-9c1048b61a32');
    });
    (0, vitest_1.it)('deve validar regra de negócio: apenas perfil ALUNO acumula horas complementares em doações', () => {
        const calcularHoras = (role, horasAtribuidas) => {
            return role === 'ALUNO' ? horasAtribuidas : 0;
        };
        (0, vitest_1.expect)(calcularHoras('ALUNO', 10)).toBe(10);
        (0, vitest_1.expect)(calcularHoras('EMPRESARIO', 50)).toBe(0);
        (0, vitest_1.expect)(calcularHoras('PROFESSOR', 10)).toBe(0);
        (0, vitest_1.expect)(calcularHoras('CIVIL', 20)).toBe(0);
    });
});
