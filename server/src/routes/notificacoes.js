const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/notificacoes/aluno/:alunoId
router.get('/aluno/:alunoId', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notificacoes WHERE aluno_id = ? ORDER BY data_envio DESC LIMIT 20`,
      [req.params.alunoId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// DELETE /api/notificacoes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM notificacoes WHERE id = ?`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
