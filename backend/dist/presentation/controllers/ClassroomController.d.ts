import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class ClassroomController {
    private enrollStudentUseCase;
    private cancelEnrollmentUseCase;
    private closeClassroomUseCase;
    create: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    list: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    enroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    cancel: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    close: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
