const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/relatorios
router.get('/', async (req, res, next) => {
  try {
    const [[totais]] = await db.query(`
      SELECT
        COUNT(*) AS totalDoacoes,
        SUM(CASE WHEN status = 'Aprovada' THEN 1 ELSE 0 END) AS totalAprovadas,
        SUM(CASE WHEN status = 'Reprovada' THEN 1 ELSE 0 END) AS totalReprovadas,
        SUM(CASE WHEN status = 'Pendente' THEN 1 ELSE 0 END) AS totalPendentes,
        COALESCE(SUM(horas_concedidas), 0) AS totalHoras
      FROM doacoes
    `);

    const [porCampanha] = await db.query(`
      SELECT c.titulo,
             COUNT(d.id) AS totalDoacoes,
             COALESCE(SUM(d.horas_concedidas), 0) AS totalHoras
      FROM campanhas c
      LEFT JOIN doacoes d ON d.campanha_id = c.id
      GROUP BY c.id, c.titulo
      ORDER BY totalDoacoes DESC
    `);

    res.json({
      totalDoacoes: totais.totalDoacoes,
      totalAprovadas: totais.totalAprovadas,
      totalReprovadas: totais.totalReprovadas,
      totalPendentes: totais.totalPendentes,
      totalHoras: parseFloat(totais.totalHoras) || 0,
      porCampanha: porCampanha.map(r => ({
        campanha: r.titulo,
        totalDoacoes: r.totalDoacoes,
        horasConcedidas: parseFloat(r.totalHoras) || 0
      }))
    });
  } catch (err) { next(err); }
});

module.exports = router;
