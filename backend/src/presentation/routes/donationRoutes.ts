import { Router } from 'express';
import { DonationController } from '../controllers/DonationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { createDonationSchema, validateDonationSchema } from '../../application/dtos/donation.dto.js';
import { Role } from '../../domain/enums/index.js';

const router = Router();
const donationController = new DonationController();

// Todas as rotas de doações requerem autenticação
router.use(authMiddleware);

// Aluno, Empresário e Civil podem solicitar/registrar doação
router.post(
  '/',
  requireRoles(Role.ALUNO, Role.EMPRESARIO, Role.CIVIL, Role.COPER),
  validate({ body: createDonationSchema }),
  donationController.create
);

// Listar doações (contextual por perfil)
router.get('/', donationController.list);

// Obter detalhes de uma doação específica
router.get('/:id', donationController.getById);

// Validação e aprovação/rejeição de doação física (Exclusivo COPER)
router.patch(
  '/:id/validate',
  requireRoles(Role.COPER),
  validate({ body: validateDonationSchema }),
  donationController.validate
);

export default router;
