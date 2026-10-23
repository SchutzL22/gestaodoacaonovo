import { Response, NextFunction } from 'express';
import { Role } from '../../domain/enums/index.js';
import { AppError } from '../../domain/errors/AppError.js';
import { AuthenticatedRequest } from './authMiddleware.js';

export function requireRoles(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Usuário não autenticado.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Acesso negado. Perfil '${req.user.role}' não tem permissão para esta ação. Perfis permitidos: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}
