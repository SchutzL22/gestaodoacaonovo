import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class CertificateController {
    private downloadPdfUseCase;
    private certificateService;
    validate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    downloadPdf: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
