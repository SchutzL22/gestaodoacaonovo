// Compatibilidade temporária — reexporta src/config/db.js (pg Pool)
// para não quebrar as rotas existentes enquanto a migração MySQL → PostgreSQL ocorre.
// TODO: remover este arquivo quando todas as rotas usarem '../config/db' diretamente.
module.exports = require('./config/db');

