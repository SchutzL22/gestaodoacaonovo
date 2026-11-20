import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateDonationUseCase } from '../src/application/use-cases/donations/CreateDonationUseCase.js';

const db = vi.hoisted(() => ({
  campaign: { findUnique: vi.fn() },
  donation: { create: vi.fn() },
}));
vi.mock('../src/infrastructure/database/prisma.js', () => ({ prisma: db }));

const input = {
  campaignId: 'campanha',
  items: [{ description: 'Agasalho', category: 'VESTUARIO', quantity: 2, unit: 'unidades' }],
};

describe('Registro de doação em campanha agendada', () => {
  beforeEach(() => vi.resetAllMocks());

  it('registra a doação quando a data inicial passou e o status salvo ainda é FUTURE', async () => {
    db.campaign.findUnique.mockResolvedValue({ status: 'FUTURE', startDate: new Date(0), endDate: null });
    db.donation.create.mockResolvedValue({ id: 'doacao' });
    await expect(new CreateDonationUseCase().execute('aluno', input)).resolves.toEqual({ id: 'doacao' });
    expect(db.donation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'aluno', items: { create: input.items } }),
    }));
  });

  it('bloqueia a gravação se a COPER encerrou a campanha', async () => {
    db.campaign.findUnique.mockResolvedValue({ status: 'CLOSED', startDate: new Date(0), endDate: null });
    await expect(new CreateDonationUseCase().execute('aluno', input)).rejects.toMatchObject({ statusCode: 400 });
    expect(db.donation.create).not.toHaveBeenCalled();
  });
});
