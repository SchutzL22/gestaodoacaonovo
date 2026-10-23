import { Router } from 'express';
import authRoutes from './authRoutes.js';
import donationRoutes from './donationRoutes.js';
import courseRoutes from './courseRoutes.js';
import classroomRoutes from './classroomRoutes.js';
import enrollmentRoutes from './enrollmentRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import publicRoutes from './publicRoutes.js';

const apiRouter = Router();

// Versão 1 e rotas padrão
apiRouter.use('/auth', authRoutes);
apiRouter.use('/donations', donationRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/classrooms', classroomRoutes);
apiRouter.use('/enrollments', enrollmentRoutes);
apiRouter.use('/attendances', attendanceRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/public', publicRoutes);

// Suporte explícito ao prefixo /v1
const v1Router = Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/donations', donationRoutes);
v1Router.use('/courses', courseRoutes);
v1Router.use('/classrooms', classroomRoutes);
v1Router.use('/enrollments', enrollmentRoutes);
v1Router.use('/attendances', attendanceRoutes);
v1Router.use('/certificates', certificateRoutes);
v1Router.use('/public', publicRoutes);
apiRouter.use('/v1', v1Router);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '3.0.0',
    platform: 'Sistema COPER 3.0',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
