import { UserRole } from '../../../domain/enums/index.js';
export declare class CloseClassroomUseCase {
    execute(classroomId: string, userId: string, userRole: UserRole): Promise<{
        message: string;
        summary: {
            totalClasses: number;
            totalEnrolled: number;
            approvedCount: number;
            failedCount: number;
            approvedStudents: {
                studentId: string;
                name: string;
                email: string;
                attendancePct: number;
                finalGrade: number | null;
                certificateId: string;
                authHash: string;
            }[];
            failedStudents: {
                studentId: string;
                name: string;
                email: string;
                attendancePct: number;
                finalGrade: number | null;
                reason: string;
            }[];
        };
    }>;
}
