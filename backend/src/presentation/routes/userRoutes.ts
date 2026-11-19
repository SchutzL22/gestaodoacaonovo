import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { Role } from '../../domain/enums/index.js';
import { AppError } from '../../domain/errors/AppError.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authMiddleware);

// COPER lista todos os usuários
router.get('/', requireRoles(Role.COPER), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { cpf: { contains: String(search) } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
          matricula: true,
          address: true,
          phone: true,
          isActive: true,
          semesterHoursLimit: true,
          totalHoursEarned: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) { next(err); }
});

// Ativar/desativar usuário (COPER)
router.patch('/:id/status', requireRoles(Role.COPER), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { isActive: Boolean(isActive) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        matricula: true,
      },
    });
    res.json({ status: 'success', data: { user } });
  } catch (err) { next(err); }
});

export default router;
