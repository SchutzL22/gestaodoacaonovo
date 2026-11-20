import axios from 'axios';

// ── Cliente Axios configurado para o COPER 3.0 ──────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Funções de Sessão ────────────────────────────────────────────────────────
export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem('coper_sessao'));
  } catch {
    return null;
  }
}

export function setSessao(sessao) {
  localStorage.setItem('coper_sessao', JSON.stringify(sessao));
  localStorage.setItem('coper_usuario', JSON.stringify({ id: sessao.id, tipo: sessao.tipo, nome: sessao.nome }));
}

export function clearSessao() {
  localStorage.removeItem('coper_sessao');
  localStorage.removeItem('coper_usuario');
}

// ── Interceptor de Request: injeta o Access Token ───────────────────────────
api.interceptors.request.use((config) => {
  const sessao = getSessao();
  if (sessao?.accessToken) {
    config._sessionId = sessao.id;
    config.headers.Authorization = `Bearer ${sessao.accessToken}`;
  }
  return config;
});

// ── Interceptor de Response: renova token automaticamente ───────────────────
let pendingRefresh;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const req = error.config;
    const session = getSessao();
    if (error.response?.status !== 401 || !req || req._retry ||
        (req.url.startsWith('/auth/') && req.url !== '/auth/me') || !session?.refreshToken) throw error;

    req._retry = true;
    if (req.headers.Authorization === `Bearer ${session.accessToken}`) {
      const token = session.refreshToken;
      if (pendingRefresh?.token !== token) {
        const promise = axios.post('/api/auth/refresh', { refreshToken: token })
          .then(({ data }) => {
            const current = getSessao();
            if (current?.refreshToken !== token) throw error;
            setSessao({ ...current, ...data.data });
          })
          .catch((err) => {
            if (err.response?.status === 401 && getSessao()?.refreshToken === token) {
              clearSessao();
              window.location.replace('/login');
            }
            throw err;
          })
          .finally(() => {
            if (pendingRefresh?.token === token) pendingRefresh = undefined;
          });
        pendingRefresh = { token, promise };
      }
      await pendingRefresh.promise;
    }
    if (getSessao()?.id !== req._sessionId) throw error;
    return api(req);
  }
);

// ─── AUTH & USUÁRIOS ─────────────────────────────────────────────────────────
export async function login(email, senha) {
  try {
    const { data } = await api.post('/auth/login', { email, password: senha });
    const user = data.data.user;
    const sessao = {
      ...user,
      nome: user.name,
      tipo: user.role === 'COPER' ? 'admin' : user.role?.toLowerCase(),
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
    setSessao(sessao);
    return sessao;
  } catch (err) {
    if (err.response?.status === 404) {
      const res = await api.post('/usuarios/login', { email, senha });
      return res.data;
    }
    throw err;
  }
}

export async function logout() {
  try {
    const sessao = getSessao();
    if (sessao?.refreshToken) {
      await api.post('/auth/logout', { refreshToken: sessao.refreshToken });
    }
  } finally {
    clearSessao();
  }
}

export async function register(dados) {
  const { data } = await api.post('/auth/register', dados);
  return data.data;
}

export const cadastrarAluno = (aluno) =>
  register({ name: aluno.nome.trim(), cpf: aluno.cpf, email: aluno.email.trim(),
    matricula: aluno.matricula.trim(), password: aluno.senha, role: 'ALUNO' });

export const solicitarRecuperacao = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const redefinirSenha = (token, password) =>
  api.post('/auth/reset-password', { token, password }).then((r) => r.data);

export const listarUsuarios = () =>
  api.get('/users').then((r) => r.data?.data || r.data).catch(() => api.get('/usuarios').then((r) => r.data));

export const buscarUsuarioPorId = (id) =>
  api.get(`/users/${id}`).then((r) => r.data?.data || r.data).catch(() => api.get(`/usuarios/${id}`).then((r) => r.data));

export const listarAlunos = () =>
  api.get('/users?role=ALUNO').then((r) => r.data?.data || r.data).catch(() => api.get('/usuarios/alunos').then((r) => r.data));

export const atualizarPerfil = (id, nome, novaSenha) =>
  api.put(`/usuarios/${id}`, { nome, novaSenha }).then((r) => r.data);

export const deletarUsuario = (id) =>
  api.delete(`/usuarios/${id}`).then((r) => r.data);

// ─── CAMPANHAS ───────────────────────────────────────────────────────────────
export const listarCampanhas = () =>
  api.get('/campanhas').then((r) => r.data);

export const buscarCampanhaPorId = (id) =>
  api.get(`/campanhas/${id}`).then((r) => r.data);

export const criarCampanha = (campanha) =>
  api.post('/campaigns', campanha).then((r) => r.data);

export const atualizarCampanha = (id, campanha) =>
  api.put(`/campaigns/${id}`, campanha).then((r) => r.data);

export const encerrarCampanha = (id) =>
  api.put(`/campaigns/${id}/encerrar`).then((r) => r.data);

export const deletarCampanha = (id) =>
  api.delete(`/campaigns/${id}`).then((r) => r.data);

// ─── DOAÇÕES ─────────────────────────────────────────────────────────────────
function formatarDoacao(d) {
  const status = { APPROVED: 'Aprovada', REJECTED: 'Reprovada', PENDING: 'Pendente' };
  return {
    ...d,
    data: d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : d.data,
    aluno: d.donorName || d.user?.name || d.aluno || 'Doador',
    matricula: d.user?.matricula || d.matricula || '',
    item: d.items?.[0]?.description || d.item || 'Doação Solidária',
    quantidade: d.items?.[0]?.quantity ?? d.quantidade ?? 1,
    horas: d.hoursEarned ?? d.horas ?? 0,
    status: status[d.status] || d.status,
    statusRaw: d.status,
  };
}

export async function listarPaginaDoacoes(page = 1, limit = 50, signal) {
  let dados;
  try {
    const { data } = await api.get('/donations', { params: { page, limit }, signal });
    dados = data.data ?? data;
  } catch (err) {
    if (err.response?.status !== 404) throw err;
    const { data } = await api.get('/doacoes', { signal });
    dados = data;
  }
  if (Array.isArray(dados)) {
    const inicio = (page - 1) * limit;
    return { doacoes: dados.slice(inicio, inicio + limit).map(formatarDoacao), totalPages: Math.ceil(dados.length / limit) };
  }
  return { doacoes: dados.donations.map(formatarDoacao), totalPages: dados.pagination.totalPages };
}

export const listarDoacoes = (page, limit) =>
  listarPaginaDoacoes(page, limit).then(resultado => resultado.doacoes);

export const listarDoacoesPorAluno = (alunoId) =>
  api.get(`/donations/student/${alunoId}`)
    .then((r) => r.data?.data || r.data);

export const listarMinhasDoacoes = () =>
  api.get('/donations/my').then((r) => r.data.data);

export const buscarDoacao = (id) =>
  api.get(`/donations/${id}`).then((r) => r.data.data);

export const registrarDoacao = (dados) => {
  if (dados instanceof FormData) {
    return api.post('/doacoes', dados, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  }
  return api.post('/donations', dados).then((r) => r.data?.data || r.data);
};

export const validarDoacao = (id, status, motivoReprovacao) => {
  const isApproved = status === 'APPROVED' || status === 'Aprovada' || status === 'APROVADA';
  return api.patch(`/donations/${id}/validate`, {
    status: isApproved ? 'APPROVED' : 'REJECTED',
    hoursEarned: isApproved ? 10 : 0,
    rejectionReason: isApproved ? null : motivoReprovacao,
  }).then((r) => r.data.data);
};

export const aprovarDoacao = (id) =>
  api.patch(`/donations/${id}/approve`).then((r) => r.data?.data || r.data);

export const rejeitarDoacao = (id, rejectionReason) =>
  api.patch(`/donations/${id}/reject`, { rejectionReason }).then((r) => r.data?.data || r.data);

export const editarDoacao = (id, dados) =>
  api.put(`/doacoes/${id}`, dados).then((r) => r.data);

export const deletarDoacao = (id) =>
  api.delete(`/doacoes/${id}`).then((r) => r.data);

// ─── ITENS PRIORITÁRIOS ─────────────────────────────────────────────────────
export const listarItensPrioritarios = () =>
  api.get('/itens-prioritarios').then((r) => r.data);

export const criarItemPrioritario = (item) =>
  api.post('/itens-prioritarios', item).then((r) => r.data);

export const atualizarItemPrioritario = (id, item) =>
  api.put(`/itens-prioritarios/${id}`, item).then((r) => r.data);

export const deletarItemPrioritario = (id) =>
  api.delete(`/itens-prioritarios/${id}`).then((r) => r.data);

// ─── RELATÓRIOS & NOTIFICAÇÕES ───────────────────────────────────────────────
export const buscarRelatorio = (signal) =>
  api.get('/relatorios', { signal }).then((r) => r.data);

export const listarNotificacoes = (alunoId) =>
  api.get(`/notificacoes/aluno/${alunoId}`).then((r) => r.data);

// ─── CURSOS & TURMAS (MÓDULO ACADÊMICO) ──────────────────────────────────────
export const listarCursos = (page = 1, limit = 50) =>
  api.get(`/courses?page=${page}&limit=${limit}`).then((r) => r.data.data);

export const buscarCurso = (id) =>
  api.get(`/courses/${id}`).then((r) => r.data.data);

export const criarCurso = (dados) =>
  api.post('/courses', dados).then((r) => r.data.data);

export const listarTurmas = (status = '') =>
  api.get(`/classrooms${status ? `?status=${status}` : ''}`).then((r) => r.data.data);

export const buscarTurma = (id) =>
  api.get(`/classrooms/${id}`).then((r) => r.data.data);

export const criarTurma = (dados) =>
  api.post('/classrooms', dados).then((r) => r.data.data);

export const buscarFilaEspera = (classroomId) =>
  api.get(`/classrooms/${classroomId}/waitlist`).then((r) => r.data.data);

export const listarTurmasProfessor = () =>
  api.get('/classrooms/teaching/my').then((r) => r.data.data);

export const salvarNotasTurma = (classroomId, grades) =>
  api.patch(`/classrooms/${classroomId}/grades`, { grades }).then((r) => r.data.data);

export const encerrarTurma = (classroomId) =>
  api.post(`/classrooms/${classroomId}/close`).then((r) => r.data.data);

export const listarProfessores = () =>
  api.get('/users?role=PROFESSOR').then((r) => r.data.data);

// ─── INSCRIÇÕES & FILA DE ESPERA (ALUNO) ────────────────────────────────────
export const minhasInscricoes = () =>
  api.get('/enrollments/my').then((r) => r.data.data);

export const inscreverTurma = (classroomId) =>
  api.post(`/classrooms/${classroomId}/enroll`).then((r) => r.data.data);

export const cancelarInscricaoTurma = (classroomId) =>
  api.post(`/classrooms/${classroomId}/cancel`).then((r) => r.data.data);

export const inscreverEmTurma = (classroomId) =>
  api.post('/enrollments', { classroomId }).then((r) => r.data.data);

export const cancelarInscricao = (enrollmentId) =>
  api.patch(`/enrollments/${enrollmentId}/cancel`).then((r) => r.data.data);

// ─── CHAMADA ONLINE ─────────────────────────────────────────────────────────
export const registrarChamada = (classroomId, classDate, records) =>
  api.post('/attendances', { classroomId, classDate, records }).then((r) => r.data.data);

export const historicoChamadaTurma = (classroomId) =>
  api.get(`/attendances/classroom/${classroomId}`).then((r) => r.data.data);

// ─── CERTIFICADOS & VALIDAÇÃO PÚBLICA ───────────────────────────────────────
export const meusCertificados = (page = 1, limit = 10) =>
  api.get(`/certificates?page=${page}&limit=${limit}`).then((r) => r.data.data);

export const emitirCertificado = (dados) =>
  api.post('/certificates/issue', dados).then((r) => r.data.data);

export const validarCertificado = (hash) =>
  api.get(`/public/validar/${hash}`).then((r) => r.data.data);

export const statsPublicas = () =>
  api.get('/public/stats').then((r) => r.data.data);

export const registrarDoacaoAnonima = (dados) =>
  api.post('/public/doacoes/anonima', dados).then((r) => r.data);

export const pesquisaGlobal = (q) =>
  api.get(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data.data);

export default api;
