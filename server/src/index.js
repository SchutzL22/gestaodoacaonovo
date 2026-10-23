require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/campanhas', require('./routes/campanhas'));
app.use('/api/doacoes', require('./routes/doacoes'));
app.use('/api/itens-prioritarios', require('./routes/itensPrioritarios'));
app.use('/api/relatorios', require('./routes/relatorios'));
app.use('/api/notificacoes', require('./routes/notificacoes'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: err.message || 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅  COPER FMP API rodando em http://localhost:${PORT}`);
});
