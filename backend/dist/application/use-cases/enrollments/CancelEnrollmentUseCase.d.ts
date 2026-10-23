export declare class CancelEnrollmentUseCase {
    private service;
    execute(studentId: string, classroomId: string): Promise<import("../../services/EnrollmentService.js").CancelResult>;
}
