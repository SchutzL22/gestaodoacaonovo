import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginUseCase } from '../src/application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../src/application/use-cases/auth/RefreshTokenUseCase.js';
import { PasswordHasher } from '../src/infrastructure/security/PasswordHasher.js';
import { TokenService } from '../src/infrastructure/security/TokenService.js';
import { Role } from '../src/domain/enums/index.js';

const store = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  refreshToken: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
}));
vi.mock('../src/infrastructure/database/prisma.js', () => ({ prisma: store }));

const payload = { userId: 'u1', email: 'teste@fmpsc.edu.br', role: Role.COPER };

beforeEach(() => {
  vi.resetAllMocks();
  store.$transaction.mockImplementation(callback => callback(store));
});

describe('Sessão e rotação de credenciais', () => {
  it('confere a senha cadastrada mesmo para uma conta da demonstração', async () => {
    store.user.findUnique.mockResolvedValue({
      id: 'u1', isActive: true, passwordHash: await PasswordHasher.hash('SenhaPessoal'),
    });
    await expect(new LoginUseCase().execute({ email: payload.email, password: 'aluno123' }))
      .rejects.toMatchObject({ statusCode: 401 });
    expect(store.refreshToken.create).not.toHaveBeenCalled();
  });

  it('bloqueia conta inativa mesmo com senha correta', async () => {
    store.user.findUnique.mockResolvedValue({
      id: 'u1', isActive: false, passwordHash: await PasswordHasher.hash('SenhaPessoal'),
    });
    await expect(new LoginUseCase().execute({ email: payload.email, password: 'SenhaPessoal' }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(store.refreshToken.create).not.toHaveBeenCalled();
  });

  it('emite tokens distintos mesmo no mesmo segundo', () => {
    const first = TokenService.generateRefreshToken(payload);
    const second = TokenService.generateRefreshToken(payload);
    expect(second).not.toBe(first);
    expect(TokenService.verifyRefreshToken(second)).toMatchObject(payload);
  });

  it('apenas uma renovação pode consumir o mesmo token', async () => {
    const token = TokenService.generateRefreshToken(payload);
    store.refreshToken.findUnique.mockResolvedValue({
      id: 'r1', revoked: false, expiresAt: new Date(Date.now() + 60000),
      user: { id: payload.userId, email: payload.email, role: payload.role, isActive: true },
    });
    store.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const useCase = new RefreshTokenUseCase();
    const results = await Promise.allSettled([useCase.execute(token), useCase.execute(token)]);
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(store.refreshToken.create).toHaveBeenCalledTimes(1);
  });
});
