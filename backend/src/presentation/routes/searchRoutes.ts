import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

// 🔍 Barra de Pesquisa Global: busca unificada por Alunos, Campanhas e Doações
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      res.json({ status: 'success', data: { students: [], campaigns: [], donations: [] } });
      return;
    }

    const cleanCpf = q.replace(/\D/g, '');

    const [students, campaigns, donations] = await Promise.all([
      // 1. Busca Alunos por Nome, Matrícula ou CPF
      prisma.user.findMany({
        where: {
          role: 'ALUNO',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { matricula: { contains: q, mode: 'insensitive' } },
            ...(cleanCpf.length >= 3 ? [{ cpf: { contains: cleanCpf } }] : []),
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          matricula: true,
          email: true,
          role: true,
          totalHoursEarned: true,
        },
      }).catch(() => []),

      // 2. Busca Campanhas por Título ou Descrição
      prisma.campaign.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          isUrgent: true,
        },
      }).catch(() => []),

      // 3. Busca Doações por Doador, Hash ou Itens Doados
      prisma.donation.findMany({
        where: {
          OR: [
            { donorName: { contains: q, mode: 'insensitive' } },
            { authHash: { contains: q, mode: 'insensitive' } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { items: { some: { description: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        take: 5,
        include: {
          user: { select: { name: true, matricula: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    res.json({
      status: 'success',
      data: {
        students,
        campaigns,
        donations: donations.map((d) => ({
          id: d.id,
          authHash: d.authHash,
          donorName: d.donorName || d.user.name,
          matricula: d.user.matricula,
          item: d.items[0]?.description || 'Doação Solidária',
          status: d.status,
          hoursEarned: d.hoursEarned,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
