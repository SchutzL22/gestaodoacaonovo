const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// Mapeador unificado de usuário
function mapUsuario(row) {
  if (!row) return null;
  const base = {
    id: row.id,
    nome: row.nome,
    email: row.email,
    cpf: row.cpf
  };
  if (row.matricula !== undefined) {
    return { ...base, matricula: row.matricula, curso: row.curso, saldoHoras: row.saldo_horas, tipo: 'aluno', role: row.curso || 'Aluno' };
  }
  return { ...base, departamento: row.departamento, cargo: row.cargo, tipo: 'admin', role: row.cargo || 'Administrador' };
}

// POST /api/usuarios/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

    // Busca em alunos
    const [alunoRows] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas
       FROM usuarios u JOIN alunos a ON u.id = a.id
       WHERE u.email = ?`, [email]
    );

    // Busca em funcionários
    const [funcRows] = await db.query(
      `SELECT u.*, f.departamento, f.cargo
       FROM usuarios u JOIN funcionarios f ON u.id = f.id
       WHERE u.email = ?`, [email]
    );

    const row = alunoRows[0] || funcRows[0];
    if (!row) return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const senhaOk = await bcrypt.compare(senha, row.senha);
    if (!senhaOk) return res.status(401).json({ erro: 'Credenciais inválidas.' });

    res.json(mapUsuario(row));
  } catch (err) { next(err); }
});

// GET /api/usuarios — lista todos (alunos + funcionários)
router.get('/', async (req, res, next) => {
  try {
    const [alunos] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas
       FROM usuarios u JOIN alunos a ON u.id = a.id`
    );
    const [funcs] = await db.query(
      `SELECT u.*, f.departamento, f.cargo
       FROM usuarios u JOIN funcionarios f ON u.id = f.id`
    );
    res.json([...alunos.map(mapUsuario), ...funcs.map(mapUsuario)]);
  } catch (err) { next(err); }
});

// GET /api/usuarios/alunos
router.get('/alunos', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas
       FROM usuarios u JOIN alunos a ON u.id = a.id`
    );
    res.json(rows.map(mapUsuario));
  } catch (err) { next(err); }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [aRows] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas
       FROM usuarios u JOIN alunos a ON u.id = a.id WHERE u.id = ?`, [id]
    );
    if (aRows[0]) return res.json(mapUsuario(aRows[0]));

    const [fRows] = await db.query(
      `SELECT u.*, f.departamento, f.cargo
       FROM usuarios u JOIN funcionarios f ON u.id = f.id WHERE u.id = ?`, [id]
    );
    if (fRows[0]) return res.json(mapUsuario(fRows[0]));

    res.status(404).json({ erro: 'Usuário não encontrado.' });
  } catch (err) { next(err); }
});

// POST /api/usuarios/alunos — cadastrar aluno
router.post('/alunos', async (req, res, next) => {
  try {
    const { nome, cpf, email, senha, matricula, curso } = req.body;
    if (!nome || !email || !senha || !matricula) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha, matrícula.' });
    }
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      `INSERT INTO usuarios (nome, cpf, email, senha) VALUES (?, ?, ?, ?)`,
      [nome, cpf || null, email, hash]
    );
    const userId = result.insertId;
    await db.query(
      `INSERT INTO alunos (id, matricula, curso, saldo_horas) VALUES (?, ?, ?, 0)`,
      [userId, matricula, curso || null]
    );
    const [rows] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas FROM usuarios u JOIN alunos a ON u.id = a.id WHERE u.id = ?`,
      [userId]
    );
    res.status(201).json(mapUsuario(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail ou matrícula já cadastrado.' });
    next(err);
  }
});

// POST /api/usuarios/funcionarios — cadastrar funcionário
router.post('/funcionarios', async (req, res, next) => {
  try {
    const { nome, cpf, email, senha, departamento, cargo } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha.' });
    }
    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      `INSERT INTO usuarios (nome, cpf, email, senha) VALUES (?, ?, ?, ?)`,
      [nome, cpf || null, email, hash]
    );
    const userId = result.insertId;
    await db.query(
      `INSERT INTO funcionarios (id, departamento, cargo) VALUES (?, ?, ?)`,
      [userId, departamento || null, cargo || null]
    );
    const [rows] = await db.query(
      `SELECT u.*, f.departamento, f.cargo FROM usuarios u JOIN funcionarios f ON u.id = f.id WHERE u.id = ?`,
      [userId]
    );
    res.status(201).json(mapUsuario(rows[0]));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    next(err);
  }
});

// PUT /api/usuarios/:id — atualizar perfil
router.put('/:id', async (req, res, next) => {
  try {
    const { nome, novaSenha } = req.body;
    const id = req.params.id;
    if (novaSenha && novaSenha.trim().length > 0) {
      const hash = await bcrypt.hash(novaSenha.trim(), 10);
      await db.query(`UPDATE usuarios SET nome = ?, senha = ? WHERE id = ?`, [nome, hash, id]);
    } else {
      await db.query(`UPDATE usuarios SET nome = ? WHERE id = ?`, [nome, id]);
    }

    // Retorna o usuário atualizado
    const [aRows] = await db.query(
      `SELECT u.*, a.matricula, a.curso, a.saldo_horas FROM usuarios u JOIN alunos a ON u.id = a.id WHERE u.id = ?`, [id]
    );
    if (aRows[0]) return res.json(mapUsuario(aRows[0]));

    const [fRows] = await db.query(
      `SELECT u.*, f.departamento, f.cargo FROM usuarios u JOIN funcionarios f ON u.id = f.id WHERE u.id = ?`, [id]
    );
    if (fRows[0]) return res.json(mapUsuario(fRows[0]));

    res.status(404).json({ erro: 'Usuário não encontrado.' });
  } catch (err) { next(err); }
});

// PUT /api/usuarios/:id/alterar-senha
router.put('/:id/alterar-senha', async (req, res, next) => {
  try {
    const { novaSenha } = req.body;
    const hash = await bcrypt.hash(novaSenha, 10);
    await db.query(`UPDATE usuarios SET senha = ? WHERE id = ?`, [hash, req.params.id]);
    res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (err) { next(err); }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM usuarios WHERE id = ?`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
