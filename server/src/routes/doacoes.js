const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

// Configuração do Multer para upload de fotos
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function formatarData(data) {
  if (!data) return null;
  if (typeof data === 'string' && data.includes('-')) {
    const [ano, mes, dia] = data.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return data;
}

async function mapDoacao(d) {
  let statusFormatado = 'Pendente';
  if (d.status === 'APROVADA') statusFormatado = 'Aprovada';
  else if (d.status === 'REPROVADA') statusFormatado = 'Reprovada';
  else if (d.status === 'AGUARDANDO_CORRECAO') statusFormatado = 'Aguardando Correção';
  else if (d.status === 'Aprovada') statusFormatado = 'Aprovada';
  else if (d.status === 'Reprovada') statusFormatado = 'Reprovada';

  return {
    id: d.id,
    data: formatarData(d.data),
    aluno: d.aluno_nome || '',
    matricula: d.matricula || '',
    item: d.quantidade && d.tipo_item ? `${d.quantidade}x ${d.tipo_item}` : (d.tipo_item || ''),
    quantidade: d.quantidade || 1,
    tipoItem: d.tipo_item || '',
    status: statusFormatado,
    horas: parseFloat(d.horas_concedidas) || 0,
    campanha: d.campanha_titulo || '',
    localEntrega: d.local_entrega || '',
    motivoReprovacao: d.motivo_reprovacao || '',
    foto: d.foto_path ? `/uploads/${d.foto_path}` : null,
    alunoId: d.aluno_id
  };
}

const DOACAO_SELECT = `
  SELECT d.*, 
         u.nome AS aluno_nome, a.matricula,
         c.titulo AS campanha_titulo,
         an.caminho AS foto_path
  FROM doacoes d
  LEFT JOIN alunos a ON d.aluno_id = a.id
  LEFT JOIN usuarios u ON a.id = u.id
  LEFT JOIN campanhas c ON d.campanha_id = c.id
  LEFT JOIN anexos an ON an.doacao_id = d.id
`;

// GET /api/doacoes
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`${DOACAO_SELECT} ORDER BY d.id DESC`);
    const doacoes = await Promise.all(rows.map(mapDoacao));
    res.json(doacoes);
  } catch (err) { next(err); }
});

// GET /api/doacoes/aluno/:alunoId
router.get('/aluno/:alunoId', async (req, res, next) => {
  try {
    const [rows] = await db.query(`${DOACAO_SELECT} WHERE d.aluno_id = ? ORDER BY d.id DESC`, [req.params.alunoId]);
    const doacoes = await Promise.all(rows.map(mapDoacao));
    res.json(doacoes);
  } catch (err) { next(err); }
});

// GET /api/doacoes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(`${DOACAO_SELECT} WHERE d.id = ?`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Doação não encontrada.' });
    res.json(await mapDoacao(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/doacoes — registrar nova doação (multipart/form-data)
router.post('/', upload.single('foto'), async (req, res, next) => {
  try {
    const { alunoId, campanhaId, tipoItem, quantidade, localEntrega } = req.body;
    if (!campanhaId || !tipoItem || !quantidade) {
      return res.status(400).json({ erro: 'Campos obrigatórios: campanhaId, tipoItem, quantidade.' });
    }
    const hoje = new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      `INSERT INTO doacoes (aluno_id, campanha_id, data, tipo_item, quantidade, local_entrega, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pendente')`,
      [alunoId || null, campanhaId, hoje, tipoItem, quantidade, localEntrega || null]
    );
    const doacaoId = result.insertId;

    if (req.file) {
      await db.query(
        `INSERT INTO anexos (doacao_id, nome_arquivo, caminho) VALUES (?, ?, ?)`,
        [doacaoId, req.file.originalname, req.file.filename]
      );
    }

    const [rows] = await db.query(`${DOACAO_SELECT} WHERE d.id = ?`, [doacaoId]);
    res.status(201).json(await mapDoacao(rows[0]));
  } catch (err) { next(err); }
});

// PUT /api/doacoes/:id/validar — validar doação (aprovar/reprovar)
router.put('/:id/validar', async (req, res, next) => {
  try {
    const { status, motivoReprovacao } = req.body;
    let horasConcedidas = null;
    let novoStatus = status;

    if (status === 'APROVADA' || status === 'Aprovada') {
      novoStatus = 'Aprovada';
      // Calcula horas baseado na quantidade (1 item = 1h, regra padrão)
      const [dRows] = await db.query(`SELECT quantidade FROM doacoes WHERE id = ?`, [req.params.id]);
      horasConcedidas = dRows[0] ? dRows[0].quantidade * 1.0 : 1.0;

      // Atualiza saldo do aluno
      const [daoRows] = await db.query(`SELECT aluno_id FROM doacoes WHERE id = ?`, [req.params.id]);
      if (daoRows[0] && daoRows[0].aluno_id) {
        await db.query(
          `UPDATE alunos SET saldo_horas = saldo_horas + ? WHERE id = ?`,
          [horasConcedidas, daoRows[0].aluno_id]
        );

        // Criar notificação
        await db.query(
          `INSERT INTO notificacoes (aluno_id, doacao_id, mensagem, canal) VALUES (?, ?, ?, 'sistema')`,
          [daoRows[0].aluno_id, req.params.id, `Sua doação foi aprovada! ${horasConcedidas}h concedidas.`]
        );
      }
    } else if (status === 'REPROVADA' || status === 'Reprovada') {
      novoStatus = 'Reprovada';
      // Criar notificação de reprovação
      const [daoRows] = await db.query(`SELECT aluno_id FROM doacoes WHERE id = ?`, [req.params.id]);
      if (daoRows[0] && daoRows[0].aluno_id) {
        await db.query(
          `INSERT INTO notificacoes (aluno_id, doacao_id, mensagem, canal) VALUES (?, ?, ?, 'sistema')`,
          [daoRows[0].aluno_id, req.params.id, `Sua doação foi reprovada. Motivo: ${motivoReprovacao || 'Não informado'}`]
        );
      }
    }

    await db.query(
      `UPDATE doacoes SET status = ?, motivo_reprovacao = ?, horas_concedidas = ? WHERE id = ?`,
      [novoStatus, motivoReprovacao || null, horasConcedidas, req.params.id]
    );

    const [rows] = await db.query(`${DOACAO_SELECT} WHERE d.id = ?`, [req.params.id]);
    res.json(await mapDoacao(rows[0]));
  } catch (err) { next(err); }
});

// PUT /api/doacoes/:id — editar doação
router.put('/:id', async (req, res, next) => {
  try {
    const { quantidade, tipoItem, matricula } = req.body;
    if (matricula) {
      const [aRows] = await db.query(`SELECT id FROM alunos WHERE matricula = ?`, [matricula]);
      if (aRows[0]) {
        await db.query(`UPDATE doacoes SET aluno_id = ? WHERE id = ?`, [aRows[0].id, req.params.id]);
      }
    }
    await db.query(
      `UPDATE doacoes SET quantidade = ?, tipo_item = ? WHERE id = ?`,
      [quantidade, tipoItem, req.params.id]
    );
    const [rows] = await db.query(`${DOACAO_SELECT} WHERE d.id = ?`, [req.params.id]);
    res.json(await mapDoacao(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/doacoes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM doacoes WHERE id = ?`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
