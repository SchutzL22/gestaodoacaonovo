import { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase.js';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';

export class AuthController {
  private registerUseCase = new RegisterUseCase();
  private loginUseCase = new LoginUseCase();
  private refreshTokenUseCase = new RefreshTokenUseCase();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerUseCase.execute(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Usuário registrado com sucesso.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Autenticação realizada com sucesso.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.refreshTokenUseCase.execute(refreshToken);
      res.status(200).json({
        status: 'success',
        message: 'Token renovado com sucesso.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw AppError.unauthorized();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw AppError.notFound('Usuário não encontrado.');
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const useCase = new (await import('../../application/use-cases/auth/ForgotPasswordUseCase.js')).ForgotPasswordUseCase();
      const result = await useCase.execute(email);
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      const useCase = new (await import('../../application/use-cases/auth/ResetPasswordUseCase.js')).ResetPasswordUseCase();
      const result = await useCase.execute(token, password);
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await prisma.refreshToken
          .updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
          })
          .catch(() => {});
      }
      res.status(200).json({ status: 'success', message: 'Sessão encerrada com sucesso.' });
    } catch (error) {
      next(error);
    }
  };
}
