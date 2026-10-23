import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class CourseController {
    create: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
