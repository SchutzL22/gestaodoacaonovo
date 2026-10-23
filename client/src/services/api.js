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
}

export function clearSessao() {
  localStorage.removeItem('coper_sessao');
  localStorage.removeItem('coper_usuario');
}

// ── Interceptor de Request: injeta o Access Token ───────────────────────────
api.interceptors.request.use((config) => {
  const sessao = getSessao();
  if (sessao?.accessToken) {
    config.headers.Authorization = `Bearer ${sessao.accessToken}`;
  }
  return config;
});

// ── Interceptor de Response: renova token automaticamente ───────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const sessao = getSessao();
        if (!sessao?.refreshToken) throw new Error('Sem refresh token');
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: sessao.refreshToken,
        });
        const novoAccessToken = data.data.accessToken;
        setSessao({ ...sessao, accessToken: novoAccessToken });
        originalRequest.headers.Authorization = `Bearer ${novoAccessToken}`;
        return api(originalRequest);
      } catch {
        clearSessao();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH & USUÁRIOS ─────────────────────────────────────────────────────────
export async function login(email, senha) {
  try {
    const { data } = await api.post('/auth/login', { email, password: senha });
    const user = data.data.user;
    const sessao = {
      ...user,
      tipo: user.role === 'COPER' ? 'admin' : user.role?.toLowerCase(),
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
    };
    setSessao(sessao);
    localStorage.setItem('coper_usuario', JSON.stringify(sessao));
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
  api.post('/auth/register', { ...aluno, role: 'ALUNO' })
    .then((r) => r.data?.data || r.data)
    .catch(() => api.post('/usuarios/alunos', aluno).then((r) => r.data));

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
  api.post('/campanhas', campanha).then((r) => r.data);

export const atualizarCampanha = (id, campanha) =>
  api.put(`/campanhas/${id}`, campanha).then((r) => r.data);

export const encerrarCampanha = (id) =>
  api.put(`/campanhas/${id}/encerrar`).then((r) => r.data);

export const deletarCampanha = (id) =>
  api.delete(`/campanhas/${id}`).then((r) => r.data);

// ─── DOAÇÕES ─────────────────────────────────────────────────────────────────
export const listarDoacoes = (page = 1, limit = 50) =>
  api.get(`/donations?page=${page}&limit=${limit}`)
    .then((r) => r.data?.data || r.data)
    .catch(() => api.get('/doacoes').then((r) => r.data));

export const listarDoacoesPorAluno = (alunoId) =>
  api.get(`/donations/student/${alunoId}`)
    .then((r) => r.data?.data || r.data)
    .catch(() => api.get(`/doacoes/aluno/${alunoId}`).then((r) => r.data));

export const listarMinhasDoacoes = () =>
  api.get('/donations/my').then((r) => r.data.data);

export const buscarDoacao = (id) =>
  api.get(`/donations/${id}`).then((r) => r.data.data);

export const registrarDoacao = (dados) => {
  if (dados instanceof FormData) {
    return axios.post('/api/doacoes', dados).then((r) => r.data);
  }
  return api.post('/donations', dados).then((r) => r.data?.data || r.data);
};

export const validarDoacao = (id, status, motivoReprovacao) => {
  if (status === 'APPROVED' || status === 'Aprovada') {
    return api.patch(`/donations/${id}/approve`).then((r) => r.data?.data || r.data);
  }
  return api.patch(`/donations/${id}/reject`, { rejectionReason: motivoReprovacao }).then((r) => r.data?.data || r.data);
};

export const aprovarDoacao = (id) =>
  api.patch(`/donations/${id}/approve`).then((r) => r.data.data);

export const rejeitarDoacao = (id, rejectionReason) =>
  api.patch(`/donations/${id}/reject`, { rejectionReason }).then((r) => r.data.data);

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
export const buscarRelatorio = () =>
  api.get('/relatorios').then((r) => r.data);

export const listarNotificacoes = (alunoId) =>
  api.get(`/notificacoes/aluno/${alunoId}`).then((r) => r.data);

// ─── CURSOS & TURMAS ────────────────────────────────────────────────────────
export const listarCursos = (page = 1, limit = 10) =>
  api.get(`/courses?page=${page}&limit=${limit}`).then((r) => r.data.data);

export const buscarCurso = (id) =>
  api.get(`/courses/${id}`).then((r) => r.data.data);

export const criarCurso = (dados) =>
  api.post('/courses', dados).then((r) => r.data.data);

export const listarTurmasDoCurso = (courseId) =>
  api.get(`/courses/${courseId}/classrooms`).then((r) => r.data.data);

export const criarTurma = (courseId, dados) =>
  api.post(`/courses/${courseId}/classrooms`, dados).then((r) => r.data.data);

export const listarAlunosDaTurma = (classroomId) =>
  api.get(`/classrooms/${classroomId}/students`).then((r) => r.data.data);

// ─── INSCRIÇÕES ─────────────────────────────────────────────────────────────
export const minhasInscricoes = () =>
  api.get('/enrollments/my').then((r) => r.data.data);

export const inscreverEmTurma = (classroomId) =>
  api.post('/enrollments', { classroomId }).then((r) => r.data.data);

export const cancelarInscricao = (enrollmentId) =>
  api.delete(`/enrollments/${enrollmentId}`).then((r) => r.data.data);

// ─── CHAMADA ────────────────────────────────────────────────────────────────
export const abrirSessaoChamada = (classroomId, classDate) =>
  api.post(`/attendances/${classroomId}/session`, { classDate }).then((r) => r.data.data);

export const registrarPresenca = (sessionId, studentId, isPresent) =>
  api.patch(`/attendances/session/${sessionId}/mark`, { studentId, isPresent }).then((r) => r.data.data);

export const historicoSessoes = (classroomId) =>
  api.get(`/attendances/${classroomId}/sessions`).then((r) => r.data.data);

// ─── CERTIFICADOS & VALIDAÇÃO PÚBLICA ───────────────────────────────────────
export const meusCertificados = (page = 1, limit = 10) =>
  api.get(`/certificates?page=${page}&limit=${limit}`).then((r) => r.data.data);

export const emitirCertificado = (dados) =>
  api.post('/certificates/issue', dados).then((r) => r.data.data);

export const validarCertificado = (hash) =>
  api.get(`/public/validar/${hash}`).then((r) => r.data.data);

export const statsPublicas = () =>
  api.get('/public/stats').then((r) => r.data.data);

export default api;
