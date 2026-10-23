import { Router } from 'express';
import { PublicValidationController } from '../controllers/PublicValidationController.js';

const router = Router();
const publicController = new PublicValidationController();

// Validação pública de autenticidade de documentos (sem autenticação)
// Suporta tanto /api/public/validar?code=HASH quanto /api/public/validar/:code
router.get('/validar', publicController.validateDocument);
router.get('/validar/:code', publicController.validateDocument);

// Estatísticas de impacto social público (visão geral para comunidade e empresários)
router.get('/stats', publicController.publicStats);

export default router;
