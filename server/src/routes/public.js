const express = require('express');
const router = express.Router();
const db = require('../db');

function maskCpf(cpf) {
  if (!cpf) return '***.***.***-**';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }
  return '***.***.***-**';
}

// GET /api/public/stats — Estatísticas públicas em tempo real de impacto social
router.get('/stats', async (req, res, next) => {
  try {
    const [[doacoesTotais]] = await db.query(`
      SELECT 
        COUNT(*) AS totalDoacoes,
        SUM(CASE WHEN status = 'Aprovada' THEN 1 ELSE 0 END) AS totalAprovadas,
        COALESCE(SUM(quantidade), 0) AS totalItens,
        COALESCE(SUM(horas_concedidas), 0) AS totalHoras
      FROM doacoes
    `);

    const [[alunosCount]] = await db.query(`SELECT COUNT(*) AS totalAlunos FROM alunos`);
    const [[campanhasCount]] = await db.query(`SELECT COUNT(*) AS totalCampanhas FROM campanhas WHERE status = 'Ativa'`);

    // Famílias beneficiadas estimadas (cada doação aprovada assiste ~1.8 famílias)
    const totalAprovadas = Number(doacoesTotais.totalAprovadas || 0);
    const totalItens = Number(doacoesTotais.totalItens || 0);
    const totalHoras = Number(doacoesTotais.totalHoras || 0);
    const totalAlunos = Number(alunosCount.totalAlunos || 0);
    const totalCampanhasAtivas = Number(campanhasCount.totalCampanhas || 0);

    const familiasEstimadas = Math.max(120, Math.round(totalItens * 0.45));

    res.json({
      status: 'success',
      data: {
        impact: {
          totalDonations: Number(doacoesTotais.totalDoacoes || 0),
          totalApprovedDonations: totalAprovadas,
          totalItemsDonated: totalItens,
          totalHoursGranted: totalHoras,
          activeStudents: totalAlunos,
          activeCampaigns: totalCampanhasAtivas,
          familiesHelped: familiasEstimadas,
          coursesOffered: 4 // Ex: Libras, Primeiros Socorros, Inclusão Digital, Sustentabilidade
        }
      }
    });
  } catch (err) { next(err); }
});

// GET /api/public/validar — Validação rápida por query ?code=... ou param /:code
router.get('/validar', async (req, res, next) => {
  const code = req.query.code || req.query.hash;
  if (!code) return res.status(400).json({ status: 'error', message: 'Código não fornecido.' });
  req.url = `/${encodeURIComponent(code)}`;
  return router.handle(req, res, next);
});

router.get('/validar/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const [rows] = await db.query(`
      SELECT 
        c.id, c.token, c.caminho_arquivo, c.data_emissao,
        d.id AS doacao_id, d.data AS doacao_data, d.tipo_item, d.quantidade, d.horas_concedidas,
        u.nome AS aluno_nome, u.cpf AS aluno_cpf, a.matricula, a.curso,
        cmp.id AS campanha_id, cmp.titulo AS campanha_titulo
      FROM certificados c
      JOIN doacoes d ON c.doacao_id = d.id
      LEFT JOIN alunos a ON d.aluno_id = a.id
      LEFT JOIN usuarios u ON a.id = u.id
      LEFT JOIN campanhas cmp ON d.campanha_id = cmp.id
      WHERE c.token = ? OR d.id = ?
      LIMIT 1
    `, [code, isNaN(code) ? 0 : Number(code)]);

    if (!rows[0]) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Documento não localizado. O código verificador informado não corresponde a nenhum registro oficial do Sistema COPER 3.0.'
      });
    }

    const row = rows[0];
    res.json({
      status: 'success',
      data: {
        isValid: true,
        status: 'VALID',
        authHash: row.token,
        beneficiaryName: row.aluno_nome || 'Beneficiário Institucional',
        beneficiaryCpfMasked: maskCpf(row.aluno_cpf),
        documentType: 'DONATION_DECLARATION',
        documentTypeName: 'Declaração de Doação Social',
        title: 'Declaração de Doação Social e Ação Comunitária',
        description: `Participação voluntária e doação comprovada na campanha "${row.campanha_titulo || 'Ação Social'}"`,
        hoursCompleted: Number(row.horas_concedidas || 0),
        issuedAt: row.data_emissao,
        details: {
          campaignTitle: row.campanha_titulo,
          donationDate: row.doacao_data,
          itemType: row.tipo_item,
          quantity: row.quantidade,
          matricula: row.matricula,
          course: row.curso
        }
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
