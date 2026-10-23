import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class EnrollmentController {
    private service;
    enroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    cancel: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    myEnrollments: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
