export declare class EnrollStudentUseCase {
    private service;
    execute(studentId: string, classroomId: string): Promise<import("../../services/EnrollmentService.js").EnrollResult>;
}
