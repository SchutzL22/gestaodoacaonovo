import { RecordAttendanceInput } from '../../dtos/attendance.dto.js';
import { UserRole } from '../../../domain/enums/index.js';
export declare class RecordAttendanceUseCase {
    execute(teacherId: string, userRole: UserRole, data: RecordAttendanceInput): Promise<{
        message: string;
        records: {
            studentId: string;
            isPresent: boolean;
            notes: string | null;
            classroomId: string;
            classDate: Date;
            id: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
}
