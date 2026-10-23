import { Router } from 'express';
import { ClassroomController } from '../controllers/ClassroomController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createClassroomSchema } from '../../application/dtos/course.dto.js';
import { Role } from '../../domain/enums/index.js';

const router = Router();
const classroomController = new ClassroomController();

router.use(authMiddleware);

// Abrir nova turma (COPER)
router.post(
  '/',
  requireRoles(Role.COPER),
  validate({ body: createClassroomSchema }),
  classroomController.create
);

// Listar turmas
router.get('/', classroomController.list);

// Obter detalhes de uma turma
router.get('/:id', classroomController.getById);

// Inscrever-se na turma (ALUNO) -> algoritmo FIFO com fila de espera automática
router.post(
  '/:id/enroll',
  requireRoles(Role.ALUNO),
  classroomController.enroll
);

// Cancelar inscrição na turma (ALUNO) -> promove automaticamente o 1º da fila de espera e envia e-mail
router.post(
  '/:id/cancel',
  requireRoles(Role.ALUNO),
  classroomController.cancel
);

// Encerrar turma e emitir certificados automaticamente (PROFESSOR ou COPER)
router.post(
  '/:id/close',
  requireRoles(Role.PROFESSOR, Role.COPER),
  classroomController.close
);

export default router;
