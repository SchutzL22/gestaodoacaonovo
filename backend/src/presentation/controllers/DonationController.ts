import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { CreateDonationUseCase } from '../../application/use-cases/donations/CreateDonationUseCase.js';
import { ValidateDonationUseCase } from '../../application/use-cases/donations/ValidateDonationUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole } from '../../domain/enums/index.js';

export class DonationController {
  private createDonationUseCase = new CreateDonationUseCase();
  private validateDonationUseCase = new ValidateDonationUseCase();

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const donation = await this.createDonationUseCase.execute(req.user.userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Solicitação de doação registrada com sucesso! Aguardando validação pela equipe COPER.',
        data: { donation },
      });
    } catch (error) {
      next(error);
    }
  };

  validate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params.id as string;
      const result = await this.validateDonationUseCase.execute(id, req.user.userId, req.body);
      res.status(200).json({
        status: 'success',
        message: `Doação ${req.body.status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      // ALUNO: lista apenas suas próprias doações
      // EMPRESARIO: lista suas doações e tem visão corporativa
      // COPER: lista todas as doações do sistema
      const whereClause =
        req.user.role === UserRole.COPER
          ? {}
          : { userId: req.user.userId };

      const [donations, total, totalHoursAgg] = await Promise.all([
        prisma.donation.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            items: true,
            user: {
              select: { id: true, name: true, email: true, cpf: true, role: true },
            },
            validatedBy: {
              select: { id: true, name: true, email: true },
            },
            certificate: {
              select: { id: true, authHash: true, validationUrl: true, issuedAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.donation.count({ where: whereClause }),
        prisma.donation.aggregate({
          where: { ...whereClause, status: 'APPROVED' },
          _sum: { hoursEarned: true },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        data: {
          donations,
          totalHours: totalHoursAgg._sum?.hoursEarned || 0,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();
      const id = req.params.id as string;

      const donation = await prisma.donation.findUnique({
        where: { id },
        include: {
          items: true,
          user: {
            select: { id: true, name: true, email: true, cpf: true, role: true },
          },
          validatedBy: {
            select: { id: true, name: true, email: true },
          },
          certificate: {
            select: { id: true, authHash: true, validationUrl: true, issuedAt: true },
          },
        },
      });

      if (!donation) {
        throw AppError.notFound('Doação não encontrada.');
      }

      if (req.user.role !== UserRole.COPER && donation.userId !== req.user.userId) {
        throw AppError.forbidden('Você não tem permissão para visualizar esta doação.');
      }

      res.status(200).json({
        status: 'success',
        data: { donation },
      });
    } catch (error) {
      next(error);
    }
  };
}
