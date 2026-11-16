const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rota GET / (health-check)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Gestão de Doações ativa.' });
});

// Registro de rotas
const authRoutes = require('./routes/auth');
const doacoesRoutes = require('./routes/doacoes');

app.use('/api/auth', authRoutes);
app.use('/api/doacoes', doacoesRoutes);

// Handler 404 para rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Handler global de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports = app;
