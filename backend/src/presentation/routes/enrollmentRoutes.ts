import { Router } from 'express';
import { EnrollmentController } from '../controllers/EnrollmentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { UserRole } from '../../domain/enums/index.js';

const router = Router();
const controller = new EnrollmentController();

router.use(authMiddleware);

// Inscrição em turma (ALUNO) com algoritmo FIFO
router.post(
  '/',
  requireRoles(UserRole.ALUNO),
  controller.enroll
);

// Cancelamento de inscrição com promoção automática do 1º da fila
router.patch(
  '/:id/cancel',
  requireRoles(UserRole.ALUNO, UserRole.COPER),
  controller.cancel
);

// Listar minhas inscrições (Aluno)
router.get(
  '/my',
  requireRoles(UserRole.ALUNO),
  controller.myEnrollments
);

export default router;
