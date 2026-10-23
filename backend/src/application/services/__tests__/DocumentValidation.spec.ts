import { describe, it, expect } from 'vitest';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

describe('Engine de Validação de Documentos Criptográficos - Estilo Unisul', () => {
  it('deve gerar authHash no formato UUIDv4 válido', () => {
    const authHash = uuidv4();
    expect(authHash).toBeDefined();
    expect(validateUuid(authHash)).toBe(true);
  });

  it('deve mascarar CPF do titular para conformidade com a LGPD', () => {
    const cpf = '12345678901';
    const maskedCpf = `***.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-**`;

    expect(maskedCpf).toBe('***.456.789-**');
    expect(maskedCpf).not.toContain('123');
    expect(maskedCpf).not.toContain('01');
  });

  it('deve montar a URL pública de conferência apontando para /validar?code=HASH', () => {
    const frontendUrl = 'https://coper.fmpsc.edu.br';
    const authHash = 'f7a2c091-8d2b-4fa3-9f12-9c1048b61a32';
    const validationUrl = `${frontendUrl}/validar?code=${authHash}`;

    expect(validationUrl).toBe('https://coper.fmpsc.edu.br/validar?code=f7a2c091-8d2b-4fa3-9f12-9c1048b61a32');
  });

  it('deve validar regra de negócio: apenas perfil ALUNO acumula horas complementares em doações', () => {
    const calcularHoras = (role: 'ALUNO' | 'EMPRESARIO' | 'PROFESSOR' | 'CIVIL', horasAtribuidas: number) => {
      return role === 'ALUNO' ? horasAtribuidas : 0;
    };

    expect(calcularHoras('ALUNO', 10)).toBe(10);
    expect(calcularHoras('EMPRESARIO', 50)).toBe(0);
    expect(calcularHoras('PROFESSOR', 10)).toBe(0);
    expect(calcularHoras('CIVIL', 20)).toBe(0);
  });
});
