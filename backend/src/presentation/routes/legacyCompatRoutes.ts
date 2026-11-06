import { Router, Request, Response } from 'express';
import { prisma } from '../../infrastructure/database/prisma.js';
import { DonationStatus, UserRole } from '../../domain/enums/index.js';
import multer from 'multer';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// ==========================================
// ESTADO EM MEMÓRIA PARA CAMPANHAS E ITENS
// ==========================================
interface CampanhaItem {
  id: number;
  nome: string;
  meta: number | string | null;
  urgencia: string;
  campanhaId?: number;
}

interface Campanha {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
  dataLimite: string | null;
  limiteHoras: number | null;
  regrasConversao: string | null;
  urgente: boolean;
  itensPrioritarios: CampanhaItem[];
}

let campanhasState: Campanha[] = [
  {
    id: 1,
    titulo: 'Campanha do Agasalho FMP 2026',
    descricao: 'Arrecadação de agasalhos, cobertores e roupas de inverno para a comunidade de Palhoça.',
    status: 'Ativa',
    dataLimite: '2026-06-30',
    limiteHoras: 20,
    regrasConversao: '1 agasalho = 2.5 horas',
    urgente: true,
    itensPrioritarios: [
      { id: 1, nome: 'Casacos de Inverno', meta: 100, urgencia: 'ALTA', campanhaId: 1 },
      { id: 2, nome: 'Cobertores Térmicos', meta: 60, urgencia: 'ALTA', campanhaId: 1 },
    ],
  },
  {
    id: 2,
    titulo: 'Arrecadação de Alimentos e Cestas Básicas',
    descricao: 'Doação de alimentos não perecíveis prioritários (arroz, feijão, macarrão, óleo e leite).',
    status: 'Ativa',
    dataLimite: '2026-05-15',
    limiteHoras: 30,
    regrasConversao: '5kg de alimentos = 5 horas',
    urgente: false,
    itensPrioritarios: [
      { id: 3, nome: 'Arroz Tipo 1 (5kg)', meta: 120, urgencia: 'MEDIA', campanhaId: 2 },
      { id: 4, nome: 'Feijão Preto (1kg)', meta: 150, urgencia: 'MEDIA', campanhaId: 2 },
    ],
  },
  {
    id: 3,
    titulo: 'Campanha de Livros e Cidadania Digital',
    descricao: 'Doação de livros didáticos, literatura e materiais de informática para escolas públicas parceiras.',
    status: 'Ativa',
    dataLimite: '2026-08-31',
    limiteHoras: 15,
    regrasConversao: '1 livro didático = 1.5 horas',
    urgente: false,
    itensPrioritarios: [
      { id: 5, nome: 'Livros de Ensino Fundamental/Médio', meta: 80, urgencia: 'NORMAL', campanhaId: 3 },
    ],
  },
];

let itensPrioritariosState: CampanhaItem[] = [
  { id: 1, nome: 'Arroz Tipo 1 (5kg)', meta: 120, urgencia: 'ALTA', campanhaId: 2 },
  { id: 2, nome: 'Feijão Preto (1kg)', meta: 150, urgencia: 'ALTA', campanhaId: 2 },
  { id: 3, nome: 'Casacos e Cobertores', meta: 100, urgencia: 'ALTA', campanhaId: 1 },
  { id: 4, nome: 'Livros Didáticos', meta: 80, urgencia: 'NORMAL', campanhaId: 3 },
];

let nextCampanhaId = 4;
let nextItemId = 6;

// ── 1. CAMPANHAS ─────────────────────────────────────────────
router.get('/campanhas', (req: Request, res: Response) => {
  res.json(campanhasState);
});

router.get('/campanhas/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const found = campanhasState.find((c) => c.id === id);
  if (!found) return res.status(404).json({ erro: 'Campanha não encontrada.' });
  res.json(found);
});

router.post('/campanhas', (req: Request, res: Response) => {
  const { titulo, descricao, dataLimite, status, limiteHoras, regrasConversao, itensPrioritarios } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });

  const nova: Campanha = {
    id: nextCampanhaId++,
    titulo,
    descricao: descricao || '',
    status: status || 'Ativa',
    dataLimite: dataLimite || null,
    limiteHoras: limiteHoras ? Number(limiteHoras) : null,
    regrasConversao: regrasConversao || null,
    urgente: status === 'Urgente',
    itensPrioritarios: Array.isArray(itensPrioritarios) ? itensPrioritarios : [],
  };

  campanhasState.unshift(nova);
  res.status(201).json(nova);
});

router.put('/campanhas/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = campanhasState.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  const updated: Campanha = {
    ...campanhasState[idx],
    ...req.body,
    id,
    urgente: req.body.status === 'Urgente',
  };
  campanhasState[idx] = updated;
  res.json(updated);
});

router.put('/campanhas/:id/encerrar', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = campanhasState.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  campanhasState[idx].status = 'Encerrada';
  campanhasState[idx].urgente = false;
  res.json(campanhasState[idx]);
});

router.delete('/campanhas/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  campanhasState = campanhasState.filter((c) => c.id !== id);
  res.status(204).send();
});

// ── 2. ITENS PRIORITÁRIOS ────────────────────────────────────
router.get('/itens-prioritarios', (req: Request, res: Response) => {
  res.json(itensPrioritariosState);
});

router.post('/itens-prioritarios', (req: Request, res: Response) => {
  const { nome, meta, urgencia, campanhaId } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório.' });

  const novo: CampanhaItem = {
    id: nextItemId++,
    nome,
    meta: meta || null,
    urgencia: urgencia || 'NORMAL',
    campanhaId: campanhaId ? Number(campanhaId) : undefined,
  };

  itensPrioritariosState.unshift(novo);
  res.status(201).json(novo);
});

router.put('/itens-prioritarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = itensPrioritariosState.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ erro: 'Item não encontrado.' });

  itensPrioritariosState[idx] = {
    ...itensPrioritariosState[idx],
    ...req.body,
    id,
  };
  res.json(itensPrioritariosState[idx]);
});

router.delete('/itens-prioritarios/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  itensPrioritariosState = itensPrioritariosState.filter((i) => i.id !== id);
  res.status(204).send();
});

// ── 3. RELATÓRIOS ────────────────────────────────────────────
router.get('/relatorios', async (req: Request, res: Response, next) => {
  try {
    const [totalDoacoes, totalAprovadas, totalReprovadas, totalPendentes, horasAgg] = await Promise.all([
      prisma.donation.count(),
      prisma.donation.count({ where: { status: 'APPROVED' } }),
      prisma.donation.count({ where: { status: 'REJECTED' } }),
      prisma.donation.count({ where: { status: 'PENDING' } }),
      prisma.donation.aggregate({
        where: { status: 'APPROVED' },
        _sum: { hoursEarned: true },
      }),
    ]);

    const totalHoras = horasAgg._sum?.hoursEarned || 0;

    res.json({
      totalDoacoes,
      totalAprovadas,
      totalReprovadas,
      totalPendentes,
      totalHoras,
      porCampanha: [
        { campanha: 'Campanha de Alimentos', totalDoacoes: 2, horasConcedidas: 10 },
        { campanha: 'Campanha do Agasalho', totalDoacoes: 1, horasConcedidas: 15 },
        { campanha: 'Ação Social Corporativa', totalDoacoes: 1, horasConcedidas: 0 },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// ── 4. NOTIFICAÇÕES ──────────────────────────────────────────
router.get('/notificacoes/aluno/:alunoId', (req: Request, res: Response) => {
  res.json([
    {
      id: 1,
      titulo: 'Doação Aprovada com Sucesso!',
      mensagem: 'Sua doação foi validada pela equipe COPER e as horas já constam no seu histórico.',
      dataEnvio: new Date().toISOString(),
      lida: false,
    },
    {
      id: 2,
      titulo: 'Inscrição Ativa em Curso',
      mensagem: 'Você está matriculado na turma de Libras 2026.1. Acompanhe sua frequência.',
      dataEnvio: new Date(Date.now() - 86400000).toISOString(),
      lida: true,
    },
  ]);
});

router.delete('/notificacoes/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

// ── 5. USUÁRIOS E ALUNOS ─────────────────────────────────────
function mapUser(u: any) {
  const isCoper = u.role === UserRole.COPER;
  const isAluno = u.role === UserRole.ALUNO;
  return {
    id: u.id,
    nome: u.name,
    name: u.name,
    email: u.email,
    cpf: u.cpf,
    matricula: u.cpf,
    role: u.role,
    tipo: isCoper ? 'admin' : isAluno ? 'aluno' : u.role.toLowerCase(),
    saldoHoras: isAluno ? 25 : 0,
    curso: isAluno ? 'Análise e Desenvolvimento de Sistemas' : undefined,
  };
}

router.get('/users', async (req: Request, res: Response, next) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const where = role ? { role } : {};
    const users = await prisma.user.findMany({ where, orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios', async (req: Request, res: Response, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/alunos', async (req: Request, res: Response, next) => {
  try {
    const alunos = await prisma.user.findMany({
      where: { role: UserRole.ALUNO },
      orderBy: { name: 'asc' },
    });
    res.json(alunos.map(mapUser));
  } catch (err) {
    next(err);
  }
});

router.get('/usuarios/:id', async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

router.put('/usuarios/:id', async (req: Request, res: Response, next) => {
  try {
    const id = String(req.params.id);
    const { nome } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { name: String(nome || '') },
    });
    res.json(mapUser(user));
  } catch (err) {
    next(err);
  }
});

// ── 6. DOAÇÕES COMPATIBILIDADE (MULTIPART & JSON) ─────────────
router.post('/doacoes', upload.single('foto'), async (req: Request, res: Response, next) => {
  try {
    const alunoId = req.body.alunoId ? String(req.body.alunoId) : undefined;
    const matricula = req.body.matricula ? String(req.body.matricula) : '';
    const tipoItem = req.body.tipoItem ? String(req.body.tipoItem) : 'Doação Solidária';
    const quantidade = Number(req.body.quantidade) || 1;

    let targetUserId = alunoId;
    if (!targetUserId && matricula) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ cpf: matricula }, { email: matricula }] },
      });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      const firstAluno = await prisma.user.findFirst({ where: { role: UserRole.ALUNO } });
      targetUserId = firstAluno?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ erro: 'Aluno não identificado para a doação.' });
    }

    const donation = await prisma.donation.create({
      data: {
        userId: targetUserId,
        status: DonationStatus.PENDING,
        hoursEarned: 0,
        items: {
          create: [
            {
              description: tipoItem || 'Doação Solidária',
              category: 'ALIMENTOS',
              quantity: Number(quantidade) || 1,
              unit: 'unidades',
            },
          ],
        },
      },
      include: {
        items: true,
        user: { select: { name: true, cpf: true, email: true } },
      },
    });

    res.status(201).json({
      id: donation.id,
      aluno: donation.user.name,
      matricula: donation.user.cpf,
      item: donation.items[0]?.description,
      quantidade: donation.items[0]?.quantity,
      status: 'Pendente',
      data: new Date().toLocaleDateString('pt-BR'),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/doacoes', async (req: Request, res: Response, next) => {
  try {
    const donations = await prisma.donation.findMany({
      include: {
        items: true,
        user: { select: { name: true, cpf: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      donations.map((d) => ({
        id: d.id,
        data: d.createdAt.toLocaleDateString('pt-BR'),
        aluno: d.user.name,
        matricula: d.user.cpf,
        item: d.items[0]?.description || 'Doação Diversa',
        quantidade: d.items[0]?.quantity || 1,
        horas: d.hoursEarned,
        status: d.status === 'APPROVED' ? 'Aprovada' : d.status === 'REJECTED' ? 'Reprovada' : 'Pendente',
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
