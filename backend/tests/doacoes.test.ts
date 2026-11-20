import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/presentation/app.js';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { Role, DonationStatus, DocType, UserRole } from '../src/domain/enums/index.js';
import { TokenService } from '../src/infrastructure/security/TokenService.js';

describe('Suíte de Testes Automatizados — Doações e Certificados (doacoes.test.ts)', () => {
  // Campanhas padrão do seed
  const CAMP_ATIVA_ID   = 'c0a80123-0000-0000-0000-000000000101'; // Agasalho e Alimentos 2026
  const CAMP_PASCOA_ID  = 'c0a80123-0000-0000-0000-000000000102'; // Páscoa 2026 (ENCERRADA)
  const CAMP_NATAL_ID   = 'c0a80123-0000-0000-0000-000000000103'; // Natal 2026 (FUTURA)

  let coperUser: any;
  let coperToken: string;
  let alunoAtivo: any;
  let alunoToken: string;
  let alunoInativo: any;
  let civilUser: any;
  let civilToken: string;
  let profUser: any;
  let profToken: string;

  beforeAll(async () => {
    // Buscar ou garantir usuários de teste no banco
    coperUser = await prisma.user.findFirst({ where: { role: UserRole.COPER } });
    coperToken = TokenService.generateAccessToken({
      userId: coperUser.id,
      email: coperUser.email,
      role: Role.COPER,
    });

    alunoAtivo = await prisma.user.findFirst({
      where: { role: UserRole.ALUNO, isActive: true },
    });
    alunoToken = TokenService.generateAccessToken({
      userId: alunoAtivo.id,
      email: alunoAtivo.email,
      role: Role.ALUNO,
    });

    alunoInativo = await prisma.user.findFirst({
      where: { email: 'aluno.inativo@aluno.fmpsc.edu.br' },
    });

    civilUser = await prisma.user.findFirst({ where: { role: UserRole.CIVIL } });
    civilToken = TokenService.generateAccessToken({
      userId: civilUser.id,
      email: civilUser.email,
      role: Role.CIVIL,
    });

    profUser = await prisma.user.findFirst({ where: { role: UserRole.PROFESSOR } });
    profToken = TokenService.generateAccessToken({
      userId: profUser.id,
      email: profUser.email,
      role: Role.PROFESSOR,
    });
  });

  describe('1. Bloqueio de Doação em Campanhas FUTURA ou ENCERRADA', () => {
    it('deve rejeitar registro de doação para campanha com status FUTURA (HTTP 400)', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          campaignId: CAMP_NATAL_ID,
          items: [
            { description: 'Brinquedos Educativos', category: 'BRINQUEDOS', quantity: 3 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toMatch(/FUTURA ou ENCERRADA/i);
    });

    it('deve rejeitar registro de doação para campanha ENCERRADA (HTTP 400)', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          campaignId: CAMP_PASCOA_ID,
          items: [
            { description: 'Chocolates e Ovos de Páscoa', category: 'ALIMENTOS', quantity: 5 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toMatch(/FUTURA ou ENCERRADA/i);
    });

    it('deve rejeitar doação anônima de Civil sem login para campanha FUTURA (HTTP 400)', async () => {
      const response = await request(app)
        .post('/api/public/doacoes/anonima')
        .send({
          donorName: 'Doador Solidário',
          donorCpf: '11122233344',
          campaignId: CAMP_NATAL_ID,
          items: [
            { description: 'Cesta de Natal', category: 'ALIMENTOS', quantity: 1 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/não está ativa|FUTURA|ENCERRADA/i);
    });

    it('deve aceitar com sucesso o registro de doação vinculada a campanha ATIVA (HTTP 201)', async () => {
      const response = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${alunoToken}`)
        .send({
          campaignId: CAMP_ATIVA_ID,
          items: [
            { description: 'Cobertores Térmicos', category: 'ROUPAS', quantity: 2 },
          ],
          observation: 'Doação de teste para campanha ativa',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      const donation = response.body.data.donation || response.body.data;
      expect(donation.id).toBeDefined();
      expect(donation.status).toBe(DonationStatus.PENDING);
    });
  });

  describe('2. Bloqueio de Aprovação de Horas para Aluno com Matrícula Inativa (RN05)', () => {
    it('deve bloquear a aprovação de doação e horas para aluno inativo (HTTP 400)', async () => {
      // Criar doação PENDENTE vinculada ao aluno inativo diretamente no banco
      const doacaoInativo = await prisma.donation.create({
        data: {
          userId: alunoInativo.id,
          status: DonationStatus.PENDING,
          authHash: `test-hash-inativo-${Date.now()}`,
          items: {
            create: [{ description: 'Casacos de Inverno', category: 'ROUPAS', quantity: 3 }],
          },
        },
      });

      // Gestor COPER tenta homologar com horas
      const response = await request(app)
        .patch(`/api/donations/${doacaoInativo.id}/validate`)
        .set('Authorization', `Bearer ${coperToken}`)
        .send({
          status: DonationStatus.APPROVED,
          hoursEarned: 10,
          observation: 'Tentativa de homologação inválida para aluno inativo',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toMatch(/matrícula inativa/i);

      // Limpeza da doação de teste
      await prisma.donationItem.deleteMany({ where: { donationId: doacaoInativo.id } });
      await prisma.donation.delete({ where: { id: doacaoInativo.id } });
    });
  });

  describe('3. Aprovação de Doação de CIVIL e PROFESSOR sem Crédito de Horas (RN13)', () => {
    it('deve aprovar doação de CIVIL concedendo 0h e emitindo documento solidário', async () => {
      const doacaoCivil = await prisma.donation.create({
        data: {
          userId: civilUser.id,
          status: DonationStatus.PENDING,
          authHash: `test-hash-civil-${Date.now()}`,
          items: {
            create: [{ description: 'Fardo de Arroz 5kg', category: 'ALIMENTOS', quantity: 4 }],
          },
        },
      });

      const userAntes = await prisma.user.findUnique({ where: { id: civilUser.id } });
      const saldoAntes = userAntes?.totalHoursEarned || 0;

      // COPER aprova informando 15 horas no body (o sistema deve zerar por ser CIVIL)
      const response = await request(app)
        .patch(`/api/donations/${doacaoCivil.id}/validate`)
        .set('Authorization', `Bearer ${coperToken}`)
        .send({
          status: DonationStatus.APPROVED,
          hoursEarned: 15,
          observation: 'Doação da comunidade homologada sem concessão acadêmica',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      const donationData = response.body.data.donation || response.body.data;
      expect(donationData.hoursEarned).toBe(0); // Forçado a 0h pela regra de negócio

      // Saldo do usuário permanece inalterado
      const userDepois = await prisma.user.findUnique({ where: { id: civilUser.id } });
      expect(userDepois?.totalHoursEarned).toBe(saldoAntes);

      // Certificado emitido sem menção a horas
      const cert = await prisma.certificate.findFirst({
        where: { donationId: doacaoCivil.id },
      });
      expect(cert).toBeDefined();
      expect(cert?.hours).toBe(0);

      // Limpeza
      if (cert) await prisma.certificate.delete({ where: { id: cert.id } });
      await prisma.donationItem.deleteMany({ where: { donationId: doacaoCivil.id } });
      await prisma.donation.delete({ where: { id: doacaoCivil.id } });
    });

    it('deve aprovar doação de PROFESSOR concedendo 0h e sem alterar saldo', async () => {
      const doacaoProf = await prisma.donation.create({
        data: {
          userId: profUser.id,
          status: DonationStatus.PENDING,
          authHash: `test-hash-prof-${Date.now()}`,
          items: {
            create: [{ description: 'Livros Didáticos', category: 'LIVROS', quantity: 10 }],
          },
        },
      });

      const response = await request(app)
        .patch(`/api/donations/${doacaoProf.id}/validate`)
        .set('Authorization', `Bearer ${coperToken}`)
        .send({
          status: DonationStatus.APPROVED,
          hoursEarned: 20,
        });

      expect(response.status).toBe(200);
      const donationProfData = response.body.data.donation || response.body.data;
      expect(donationProfData.hoursEarned).toBe(0);

      // Limpeza
      await prisma.certificate.deleteMany({ where: { donationId: doacaoProf.id } });
      await prisma.donationItem.deleteMany({ where: { donationId: doacaoProf.id } });
      await prisma.donation.delete({ where: { id: doacaoProf.id } });
    });
  });

  describe('4. Aprovação de Doação de ALUNO e Validação Pública de Autenticidade', () => {
    it('deve aprovar doação de ALUNO somando horas no saldo e emitindo hash verificável na rota pública', async () => {
      // Garante margem de limite semestral para o teste
      await prisma.user.update({
        where: { id: alunoAtivo.id },
        data: { semesterHoursLimit: 100, totalHoursEarned: 10 },
      });
      const saldoAntes = 10;

      const doacaoAluno = await prisma.donation.create({
        data: {
          userId: alunoAtivo.id,
          status: DonationStatus.PENDING,
          authHash: `test-hash-aluno-${Date.now()}`,
          items: {
            create: [{ description: 'Pacotes de Feijão 1kg', category: 'ALIMENTOS', quantity: 5 }],
          },
        },
      });

      const HORAS_CONCEDIDAS = 6;

      // COPER aprova a doação com 6 horas
      const response = await request(app)
        .patch(`/api/donations/${doacaoAluno.id}/validate`)
        .set('Authorization', `Bearer ${coperToken}`)
        .send({
          status: DonationStatus.APPROVED,
          hoursEarned: HORAS_CONCEDIDAS,
          observation: 'Homologação oficial de horas de extensão',
        });

      expect(response.status).toBe(200);
      const donationAlunoData = response.body.data.donation || response.body.data;
      expect(donationAlunoData.hoursEarned).toBe(HORAS_CONCEDIDAS);

      // Verifica incremento do saldo de horas do aluno
      const userDepois = await prisma.user.findUnique({ where: { id: alunoAtivo.id } });
      expect(userDepois?.totalHoursEarned).toBe(saldoAntes + HORAS_CONCEDIDAS);

      // Busca o certificado oficial gerado com o authHash
      const cert = await prisma.certificate.findFirst({
        where: { donationId: doacaoAluno.id },
      });
      expect(cert).toBeDefined();
      expect(cert?.authHash).toBeDefined();

      // Consulta a rota pública de validação desautenticada: GET /api/public/validar/:code
      const validacaoPublica = await request(app).get(`/api/public/validar/${cert!.authHash}`);

      expect(validacaoPublica.status).toBe(200);
      expect(validacaoPublica.body.status).toBe('success');
      expect(validacaoPublica.body.data.isValid).toBe(true);
      expect(validacaoPublica.body.data.hoursEarned).toBe(HORAS_CONCEDIDAS);
      expect(validacaoPublica.body.data.holderName).toContain(alunoAtivo.name);

      // Limpeza dos dados de teste criados
      await prisma.certificate.delete({ where: { id: cert!.id } });
      await prisma.donationItem.deleteMany({ where: { donationId: doacaoAluno.id } });
      await prisma.donation.delete({ where: { id: doacaoAluno.id } });
      await prisma.user.update({
        where: { id: alunoAtivo.id },
        data: { totalHoursEarned: saldoAntes },
      });
    });
  });
});
