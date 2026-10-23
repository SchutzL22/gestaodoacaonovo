import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from '../domain/errors/AppError.js';

dotenv.config();

const app = express();

// 1. Segurança de Cabeçalhos HTTP com Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitado se servir assets/PDFs inline
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Proteção contra ataques de força bruta e DoS (Rate Limiting)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Máximo de 300 requisições por IP na janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Muitas requisições originadas deste IP. Tente novamente em 15 minutos.',
  },
});
app.use(globalLimiter);

// 3. CORS com configuração estrita
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (como mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pela política de CORS do Sistema COPER 3.0'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 4. Parsers de corpo de requisição com limitação de tamanho seguro (Sanitização DoS)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Rotas da API
app.use('/api', apiRouter);

// 6. 404 Handler para rotas inexistentes
app.use((req, res, next) => {
  next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
});

// 7. Middleware Global de Tratamento de Erros
app.use(errorHandler);

export default app;
