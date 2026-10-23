import { Request, Response, NextFunction } from 'express';
export declare class PublicValidationController {
    private validateUseCase;
    validateDocument: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    publicStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
