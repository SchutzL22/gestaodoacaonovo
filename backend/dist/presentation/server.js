"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 3001;
const server = app_js_1.default.listen(PORT, () => {
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
