import { Request, Response, NextFunction } from 'express';
import { TokenService, TokenPayload } from '../../infrastructure/security/TokenService.js';
import { AppError } from '../../domain/errors/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token de autenticação não fornecido ou formato inválido.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    throw AppError.unauthorized('Token inválido ou expirado.');
  }
}
