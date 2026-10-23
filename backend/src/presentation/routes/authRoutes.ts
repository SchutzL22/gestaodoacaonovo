import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../../application/dtos/auth.dto.js';

const router = Router();
const authController = new AuthController();

// Rate limiter específico para prevenir força bruta em rotas de autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 25, // Máximo de 25 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Muitas tentativas de login ou cadastro. Por segurança, tente novamente em 15 minutos.',
  },
});

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refreshToken);
router.get('/me', authMiddleware, authController.me);

export default router;
