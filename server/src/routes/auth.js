const express = require('express');
const router  = express.Router();

// TODO: implementar autenticação (login, registro, refresh-token)
// Este arquivo é um stub temporário criado durante a refatoração.

router.post('/login', (_req, res) => {
  res.status(501).json({ erro: 'Endpoint de login ainda não implementado.' });
});

router.post('/register', (_req, res) => {
  res.status(501).json({ erro: 'Endpoint de registro ainda não implementado.' });
});

module.exports = router;
