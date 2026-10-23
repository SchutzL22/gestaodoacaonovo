import { Router } from 'express';
import { CourseController } from '../controllers/CourseController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createCourseSchema } from '../../application/dtos/course.dto.js';
import { Role } from '../../domain/enums/index.js';

const router = Router();
const courseController = new CourseController();

router.use(authMiddleware);

// Cadastrar novo curso extracurricular (COPER)
router.post(
  '/',
  requireRoles(Role.COPER),
  validate({ body: createCourseSchema }),
  courseController.create
);

// Listar todos os cursos
router.get('/', courseController.list);

// Obter detalhes de um curso
router.get('/:id', courseController.getById);

export default router;
