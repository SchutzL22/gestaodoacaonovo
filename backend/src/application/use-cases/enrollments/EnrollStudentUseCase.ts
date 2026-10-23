import { EnrollmentService } from '../../services/EnrollmentService.js';

export class EnrollStudentUseCase {
  private service = new EnrollmentService();

  async execute(studentId: string, classroomId: string) {
    return this.service.enroll(studentId, classroomId);
  }
}
