import { EnrollmentStatus } from '../../domain/enums/index.js';
export interface EnrollResult {
    enrollment: {
        id: string;
        classroomId: string;
        studentId: string;
        status: EnrollmentStatus;
        waitlistPosition: number | null;
    };
    message: string;
    isWaitlist: boolean;
    position?: number;
}
export interface CancelResult {
    message: string;
    cancelledEnrollmentId: string;
    promotedStudent: {
        id: string;
        name: string;
        email: string;
        courseTitle: string;
    } | null;
}
export declare class EnrollmentService {
    enroll(studentId: string, classroomId: string): Promise<EnrollResult>;
    cancel(enrollmentId: string, requesterId: string, isCoper?: boolean): Promise<CancelResult>;
}
