import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class DonationController {
    private createDonationUseCase;
    private validateDonationUseCase;
    create: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    validate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
