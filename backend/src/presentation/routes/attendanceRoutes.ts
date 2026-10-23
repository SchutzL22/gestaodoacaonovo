import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { recordAttendanceSchema } from '../../application/dtos/attendance.dto.js';
import { Role } from '../../domain/enums/index.js';

const router = Router();
const attendanceController = new AttendanceController();

router.use(authMiddleware);

// Realizar chamada online da turma (PROFESSOR ou COPER)
router.post(
  '/',
  requireRoles(Role.PROFESSOR, Role.COPER),
  validate({ body: recordAttendanceSchema }),
  attendanceController.record
);

// Obter histórico de frequências da turma
router.get(
  '/classroom/:classroomId',
  requireRoles(Role.PROFESSOR, Role.COPER),
  attendanceController.getByClassroom
);

export default router;
