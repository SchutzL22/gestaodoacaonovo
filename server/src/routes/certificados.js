const express = require('express');
const router = express.Router();
const db = require('../db');
const { gerarCertificadoPDF } = require('../services/pdfService');

function maskCpf(cpf) {
  if (!cpf) return '***.***.***-**';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }
  return '***.***.***-**';
}

// ── GET /api/certificados — listar todos os certificados
router.get('/', async (req, res, next) => {
  try {
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
      ORDER BY c.data_emissao DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// ── GET /api/certificados/validar/:token e /validate/:token — Validação pública do token/hash
const validarHandler = async (req, res, next) => {
  try {
    const { token } = req.params;
    const [rows] = await db.query(`
      SELECT 
        c.id, c.token, c.caminho_arquivo, c.data_emissao,
        d.id AS doacao_id, d.data AS doacao_data, d.tipo_item, d.quantidade, d.horas_concedidas, d.status AS doacao_status,
        u.nome AS aluno_nome, u.cpf AS aluno_cpf, a.matricula, a.curso,
        cmp.id AS campanha_id, cmp.titulo AS campanha_titulo
      FROM certificados c
      JOIN doacoes d ON c.doacao_id = d.id
      LEFT JOIN alunos a ON d.aluno_id = a.id
      LEFT JOIN usuarios u ON a.id = u.id
      LEFT JOIN campanhas cmp ON d.campanha_id = cmp.id
      WHERE c.token = ? OR d.id = ?
      LIMIT 1
    `, [token, isNaN(token) ? 0 : Number(token)]);

    if (!rows[0]) {
      return res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Documento não localizado. O código verificador informado não corresponde a nenhum registro oficial do Sistema COPER 3.0.'
      });
    }

    const row = rows[0];
    const dataResponse = {
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
    };

    // Suporta formato duplo (antigo do Java Map.of e novo do COPER 3.0)
    res.json({
      status: 'success',
      data: dataResponse,
      valido: true,
      token: row.token,
      aluno: row.aluno_nome,
      campanha: row.campanha_titulo,
      horasConcedidas: row.horas_concedidas,
      dataEmissao: row.data_emissao
    });
  } catch (err) { next(err); }
};

router.get('/validar/:token', validarHandler);
router.get('/validate/:token', validarHandler);
router.get('/token/:token', validarHandler);

// ── GET /api/certificados/doacao/:doacaoId
router.get('/doacao/:doacaoId', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM certificados WHERE doacao_id = ? LIMIT 1', [req.params.doacaoId]);
    if (!rows[0]) return res.status(404).json({ erro: 'Certificado não encontrado para esta doação.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/certificados/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM certificados WHERE id = ? LIMIT 1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Certificado não encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/certificados/download/:doacaoId — Download direto do PDF
router.get('/download/:doacaoId', async (req, res, next) => {
  try {
    const { doacaoId } = req.params;
    const [rows] = await db.query(`
      SELECT 
        c.id, c.token, c.data_emissao,
        d.id AS doacao_id, d.data AS doacao_data, d.tipo_item, d.quantidade, d.horas_concedidas,
        u.nome AS aluno_nome, u.cpf AS aluno_cpf, a.matricula, a.curso,
        cmp.id AS campanha_id, cmp.titulo AS campanha_titulo
      FROM doacoes d
      LEFT JOIN certificados c ON c.doacao_id = d.id
      LEFT JOIN alunos a ON d.aluno_id = a.id
      LEFT JOIN usuarios u ON a.id = u.id
      LEFT JOIN campanhas cmp ON d.campanha_id = cmp.id
      WHERE d.id = ?
      LIMIT 1
    `, [doacaoId]);

    if (!rows[0]) return res.status(404).json({ erro: 'Doação não encontrada.' });
    const row = rows[0];

    // Se ainda não tinha token, gera um
    let token = row.token;
    if (!token) {
      token = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
      await db.query(`INSERT INTO certificados (doacao_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = VALUES(token)`, [doacaoId, token]);
    }

    const pdfBuffer = await gerarCertificadoPDF({
      token: token,
      alunoNome: row.aluno_nome,
      alunoMatricula: row.matricula,
      alunoCurso: row.curso,
      campanhaTitulo: row.campanha_titulo,
      tipoItem: row.tipo_item,
      quantidade: row.quantidade,
      horasConcedidas: row.horas_concedidas,
      dataDoacao: row.doacao_data ? new Date(row.doacao_data).toLocaleDateString('pt-BR') : null,
      dataEmissao: row.data_emissao || new Date()
    });

    const filename = `Certificado_COPER_Doacao_${doacaoId}_${token}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

module.exports = router;
