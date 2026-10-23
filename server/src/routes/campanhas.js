const express = require('express');
const router = express.Router();
const db = require('../db');

function mapCampanha(c) {
  return {
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao || '',
    status: c.status,
    dataLimite: c.data_limite,
    limiteHoras: c.limite_horas,
    regrasConversao: c.regras_conversao,
    urgente: c.status === 'Urgente',
    itensPrioritarios: [] // preenchido por join se necessário
  };
}

// GET /api/campanhas
router.get('/', async (req, res, next) => {
  try {
    const [campanhas] = await db.query(`SELECT * FROM campanhas ORDER BY id DESC`);
    const ids = campanhas.map(c => c.id);
    let itensMap = {};
    if (ids.length > 0) {
      const [itens] = await db.query(
        `SELECT * FROM itens_prioritarios WHERE campanha_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      itens.forEach(i => {
        if (!itensMap[i.campanha_id]) itensMap[i.campanha_id] = [];
        itensMap[i.campanha_id].push({ id: i.id, nome: i.nome, meta: i.meta, urgencia: i.urgencia });
      });
    }
    res.json(campanhas.map(c => ({ ...mapCampanha(c), itensPrioritarios: itensMap[c.id] || [] })));
  } catch (err) { next(err); }
});

// GET /api/campanhas/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM campanhas WHERE id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Campanha não encontrada.' });
    const [itens] = await db.query(`SELECT * FROM itens_prioritarios WHERE campanha_id = ?`, [req.params.id]);
    const campanha = { ...mapCampanha(rows[0]), itensPrioritarios: itens.map(i => ({ id: i.id, nome: i.nome, meta: i.meta, urgencia: i.urgencia })) };
    res.json(campanha);
  } catch (err) { next(err); }
});

// POST /api/campanhas
router.post('/', async (req, res, next) => {
  try {
    const { titulo, descricao, dataLimite, status, limiteHoras, regrasConversao, itensPrioritarios } = req.body;
    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });
    const [result] = await db.query(
      `INSERT INTO campanhas (titulo, descricao, data_limite, status, limite_horas, regras_conversao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, dataLimite || null, status || 'Ativa', limiteHoras || null, regrasConversao || null]
    );
    const campanhaId = result.insertId;
    if (Array.isArray(itensPrioritarios) && itensPrioritarios.length > 0) {
      for (const item of itensPrioritarios) {
        await db.query(
          `INSERT INTO itens_prioritarios (campanha_id, nome, meta, urgencia) VALUES (?, ?, ?, ?)`,
          [campanhaId, item.nome, item.meta || null, item.urgencia || 'NORMAL']
        );
      }
    }
    const [rows] = await db.query(`SELECT * FROM campanhas WHERE id = ?`, [campanhaId]);
    const [itens] = await db.query(`SELECT * FROM itens_prioritarios WHERE campanha_id = ?`, [campanhaId]);
    res.status(201).json({ ...mapCampanha(rows[0]), itensPrioritarios: itens });
  } catch (err) { next(err); }
});

// PUT /api/campanhas/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { titulo, descricao, dataLimite, status, limiteHoras, regrasConversao, itensPrioritarios } = req.body;
    await db.query(
      `UPDATE campanhas SET titulo = ?, descricao = ?, data_limite = ?, status = ?, limite_horas = ?, regras_conversao = ?
       WHERE id = ?`,
      [titulo, descricao || null, dataLimite || null, status || 'Ativa', limiteHoras || null, regrasConversao || null, req.params.id]
    );
    // Atualiza itens prioritários se fornecidos
    if (Array.isArray(itensPrioritarios)) {
      await db.query(`DELETE FROM itens_prioritarios WHERE campanha_id = ?`, [req.params.id]);
      for (const item of itensPrioritarios) {
        await db.query(
          `INSERT INTO itens_prioritarios (campanha_id, nome, meta, urgencia) VALUES (?, ?, ?, ?)`,
          [req.params.id, item.nome, item.meta || null, item.urgencia || 'NORMAL']
        );
      }
    }
    const [rows] = await db.query(`SELECT * FROM campanhas WHERE id = ?`, [req.params.id]);
    const [itens] = await db.query(`SELECT * FROM itens_prioritarios WHERE campanha_id = ?`, [req.params.id]);
    res.json({ ...mapCampanha(rows[0]), itensPrioritarios: itens });
  } catch (err) { next(err); }
});

// PUT /api/campanhas/:id/encerrar
router.put('/:id/encerrar', async (req, res, next) => {
  try {
    await db.query(`UPDATE campanhas SET status = 'Encerrada' WHERE id = ?`, [req.params.id]);
    const [rows] = await db.query(`SELECT * FROM campanhas WHERE id = ?`, [req.params.id]);
    res.json(mapCampanha(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/campanhas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM campanhas WHERE id = ?`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
