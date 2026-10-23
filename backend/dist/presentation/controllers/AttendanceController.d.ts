import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
export declare class AttendanceController {
    private recordAttendanceUseCase;
    record: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    getByClassroom: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
