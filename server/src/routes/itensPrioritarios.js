const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/itens-prioritarios
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM itens_prioritarios ORDER BY id DESC`);
    res.json(rows.map(i => ({ id: i.id, nome: i.nome, meta: i.meta, urgencia: i.urgencia, campanhaId: i.campanha_id })));
  } catch (err) { next(err); }
});

// POST /api/itens-prioritarios
router.post('/', async (req, res, next) => {
  try {
    const { nome, meta, urgencia, campanhaId } = req.body;
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });
    const [result] = await db.query(
      `INSERT INTO itens_prioritarios (campanha_id, nome, meta, urgencia) VALUES (?, ?, ?, ?)`,
      [campanhaId || null, nome, meta || null, urgencia || 'NORMAL']
    );
    const [rows] = await db.query(`SELECT * FROM itens_prioritarios WHERE id = ?`, [result.insertId]);
    const i = rows[0];
    res.status(201).json({ id: i.id, nome: i.nome, meta: i.meta, urgencia: i.urgencia, campanhaId: i.campanha_id });
  } catch (err) { next(err); }
});

// PUT /api/itens-prioritarios/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { nome, meta, urgencia } = req.body;
    await db.query(
      `UPDATE itens_prioritarios SET nome = ?, meta = ?, urgencia = ? WHERE id = ?`,
      [nome, meta || null, urgencia || 'NORMAL', req.params.id]
    );
    const [rows] = await db.query(`SELECT * FROM itens_prioritarios WHERE id = ?`, [req.params.id]);
    const i = rows[0];
    res.json({ id: i.id, nome: i.nome, meta: i.meta, urgencia: i.urgencia, campanhaId: i.campanha_id });
  } catch (err) { next(err); }
});

// DELETE /api/itens-prioritarios/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM itens_prioritarios WHERE id = ?`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
