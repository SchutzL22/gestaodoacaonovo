import { Response, NextFunction } from 'express';
import { Role } from '../../domain/enums/index.js';
import { AuthenticatedRequest } from './authMiddleware.js';
export declare function requireRoles(...allowedRoles: Role[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
