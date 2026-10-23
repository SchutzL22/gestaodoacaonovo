import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../../infrastructure/security/TokenService.js';
export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}
export declare function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
