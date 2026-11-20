import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/presentation/app.js';
import { Role } from '../src/domain/enums/index.js';
import { TokenService } from '../src/infrastructure/security/TokenService.js';

describe('Suíte de Testes Automatizados — Autenticação e Cadastro (auth.test.ts)', () => {
  describe('1. Validação de Domínio de Aluno (@aluno.fmpsc.edu.br)', () => {
    it('deve bloquear cadastro de ALUNO com e-mail fora do domínio @aluno.fmpsc.edu.br (ex: gmail)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Aluno Teste Inválido',
          email: 'aluno.invalido@gmail.com',
          cpf: '123.456.789-99',
          password: 'SenhaSegura@2026',
          role: Role.ALUNO,
          matricula: '20261999',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      // A mensagem de erro da validação Zod deve indicar a restrição de domínio
      const errorsStr = JSON.stringify(response.body);
      expect(errorsStr).toMatch(/@aluno\.fmpsc\.edu\.br/i);
    });

    it('deve bloquear cadastro de ALUNO sem matrícula institucional', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Aluno Sem Matrícula',
          email: 'aluno.semmatricula@aluno.fmpsc.edu.br',
          cpf: '123.456.789-98',
          password: 'SenhaSegura@2026',
          role: Role.ALUNO,
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      const errorsStr = JSON.stringify(response.body);
      expect(errorsStr).toMatch(/matrícula.*obrigatória/i);
    });

    it('deve aceitar perfil CIVIL com e-mail de provedor público (ex: @gmail.com)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Civil Comunidade',
          email: `civil.teste.${Date.now()}@gmail.com`,
          cpf: '000.111.222-33',
          password: 'SenhaSegura@2026',
          role: Role.CIVIL,
        });

      // Se o CPF já existir no banco pode dar erro de duplicidade, mas NÃO erro de domínio de e-mail (400 Zod)
      if (response.status === 400) {
        const errorsStr = JSON.stringify(response.body);
        expect(errorsStr).not.toMatch(/@aluno\.fmpsc\.edu\.br/i);
      } else {
        expect([201, 409]).toContain(response.status);
      }
    });
  });

  describe('2. Controle de Acesso Baseado em Perfis (RBAC)', () => {
    it('deve bloquear perfil ALUNO tentando acessar rota restrita da COPER (HTTP 403 Forbidden)', async () => {
      // Gera token com perfil ALUNO
      const alunoToken = TokenService.generateAccessToken({
        userId: 'student-uuid-test',
        email: 'aluno.teste@aluno.fmpsc.edu.br',
        role: Role.ALUNO,
      });

      // Tenta acessar exportação CSV de relatórios (rota exclusiva COPER)
      const response = await request(app)
        .get('/api/reports/export/csv?startDate=2026-06-01&endDate=2026-11-01')
        .set('Authorization', `Bearer ${alunoToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toMatch(/Acesso negado.*Perfil.*ALUNO/i);
    });

    it('deve bloquear perfil ALUNO tentando criar campanha administrativa (HTTP 403 Forbidden)', async () => {
      const alunoToken = TokenService.generateAccessToken({
        userId: 'student-uuid-test',
        email: 'aluno.teste@aluno.fmpsc.edu.br',
        role: Role.ALUNO,
      });

      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          title: 'Campanha Hack Aluno',
          description: 'Tentativa não autorizada',
          startDate: '2026-01-01',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Acesso negado/i);
    });

    it('deve permitir acesso à rota administrativa para usuário com perfil COPER', async () => {
      const coperToken = TokenService.generateAccessToken({
        userId: 'coper-admin-uuid',
        email: 'coper@fmpsc.edu.br',
        role: Role.COPER,
      });

      const response = await request(app)
        .get('/api/reports/export/csv?startDate=2026-06-01&endDate=2026-11-01')
        .set('Authorization', `Bearer ${coperToken}`);

      // Não deve ser 403 Forbidden (pode ser 200 com arquivo CSV)
      expect(response.status).not.toBe(403);
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/text\/csv/i);
    });
  });

  describe('3. Proteção contra Ataques de Força Bruta no Login (Rate Limiting)', () => {
    it('deve retornar 401 Credenciais Inválidas para senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario.inexistente@fmpsc.edu.br',
          password: 'senha_incorreta_teste',
        });

      expect([401, 429]).toContain(response.status);
    });

    it('deve acionar bloqueio HTTP 429 Too Many Requests após exceder o limite de tentativas', async () => {
      let lastStatus = 200;
      let lastBody: any = null;

      // O rate limiter authLimiter permite até 25 requisições por IP na janela
      for (let i = 0; i < 26; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'bruteforce@fmpsc.edu.br',
            password: `tentativa_${i}`,
          });
        lastStatus = res.status;
        lastBody = res.body;
        if (res.status === 429) break;
      }

      expect(lastStatus).toBe(429);
      expect(lastBody.statusCode || lastBody.status).toBeDefined();
      const message = lastBody.message || '';
      expect(message).toMatch(/Muitas (tentativas|requisições)/i);
    });
  });
});
