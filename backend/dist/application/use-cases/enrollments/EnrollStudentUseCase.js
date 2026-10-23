"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollStudentUseCase = void 0;
const EnrollmentService_js_1 = require("../../services/EnrollmentService.js");
class EnrollStudentUseCase {
    service = new EnrollmentService_js_1.EnrollmentService();
    async execute(studentId, classroomId) {
        return this.service.enroll(studentId, classroomId);
    }
}
exports.EnrollStudentUseCase = EnrollStudentUseCase;
