import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, () => {
  console.log(`
  =======================================================
   🚀 SISTEMA COPER 3.0 - BACKEND INICIADO COM SUCESSO!
   📡 Porta: ${PORT}
   🌐 Base URL: http://localhost:${PORT}/api
   📋 Healthcheck: http://localhost:${PORT}/api/health
   🛡️  Arquitetura: Clean Architecture & DDD + Prisma ORM
  =======================================================
  `);
});

process.on('SIGTERM', () => {
  console.log('[Server] Encerrando processo graciosamente...');
  server.close(() => {
    console.log('[Server] Servidor HTTP finalizado.');
    process.exit(0);
  });
});
