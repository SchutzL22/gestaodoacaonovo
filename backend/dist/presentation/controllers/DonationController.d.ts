import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class DonationController {
    private createDonationUseCase;
    private validateDonationUseCase;
    private downloadPdfUseCase;
    create: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    validate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    approve: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    reject: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    listByStudent: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    downloadEvidence: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    downloadPdf: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
