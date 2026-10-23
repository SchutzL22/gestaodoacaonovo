import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class AuthController {
    private registerUseCase;
    private loginUseCase;
    private refreshTokenUseCase;
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    me: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
