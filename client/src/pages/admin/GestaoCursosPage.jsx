import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Users,
  PlusCircle,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  X,
  Search,
  Eye,
  GraduationCap
} from 'lucide-react';
import {
  listarCursos,
  criarCurso,
  listarTurmas,
  criarTurma,
  listarProfessores,
  buscarFilaEspera
} from '../../services/api';

export default function GestaoCursosPage() {
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [modalCursoOpen, setModalCursoOpen] = useState(false);
  const [modalTurmaOpen, setModalTurmaOpen] = useState(false);
  const [modalFilaOpen, setModalFilaOpen] = useState(false);
  const [selectedTurmaFila, setSelectedTurmaFila] = useState(null);
  const [filaData, setFilaData] = useState(null);
  const [loadingFila, setLoadingFila] = useState(false);

  // Form Curso
  const [cursoForm, setCursoForm] = useState({
    title: '',
    description: '',
    instructorId: '',
    workloadHours: 40,
    minAttendancePct: 75,
  });

  // Form Turma
  const [turmaForm, setTurmaForm] = useState({
    courseId: '',
    code: '',
    maxCapacity: 25,
    startDate: '',
    endDate: '',
    enrollmentStartDate: '',
    enrollmentEndDate: '',
    cancellationDeadline: '',
    minGrade: 7.0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resCursos, resTurmas, resProfs] = await Promise.all([
        listarCursos().catch(() => ({ courses: [] })),
        listarTurmas().catch(() => ({ classrooms: [] })),
        listarProfessores().catch(() => ({ users: [] })),
      ]);

      setCursos(resCursos?.courses || []);
      setTurmas(resTurmas?.classrooms || []);
      setProfessores(resProfs?.users || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados acadêmicos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCriarCurso(e) {
    e.preventDefault();
    if (!cursoForm.title || !cursoForm.description || !cursoForm.instructorId) {
      return toast.error('Preencha todos os campos obrigatórios do curso.');
    }

    setSaving(true);
    try {
      await criarCurso({
        title: cursoForm.title,
        description: cursoForm.description,
        instructorId: cursoForm.instructorId,
        workloadHours: Number(cursoForm.workloadHours),
        minAttendancePct: Number(cursoForm.minAttendancePct),
      });

      toast.success('Curso cadastrado com sucesso!');
      setModalCursoOpen(false);
      setCursoForm({
        title: '',
        description: '',
        instructorId: '',
        workloadHours: 40,
        minAttendancePct: 75,
      });
      carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar curso.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCriarTurma(e) {
    e.preventDefault();
    if (!turmaForm.courseId || !turmaForm.startDate || !turmaForm.endDate) {
      return toast.error('Selecione o curso e as datas de início/término.');
    }

    setSaving(true);
    try {
      await criarTurma({
        courseId: turmaForm.courseId,
        code: turmaForm.code || undefined,
        maxCapacity: Number(turmaForm.maxCapacity),
        startDate: turmaForm.startDate,
        endDate: turmaForm.endDate,
        enrollmentStartDate: turmaForm.enrollmentStartDate || null,
        enrollmentEndDate: turmaForm.enrollmentEndDate || null,
        cancellationDeadline: turmaForm.cancellationDeadline || null,
        minGrade: Number(turmaForm.minGrade),
      });

      toast.success('Turma criada com sucesso!');
      setModalTurmaOpen(false);
      setTurmaForm({
        courseId: '',
        code: '',
        maxCapacity: 25,
        startDate: '',
        endDate: '',
        enrollmentStartDate: '',
        enrollmentEndDate: '',
        cancellationDeadline: '',
        minGrade: 7.0,
      });
      carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao abrir turma.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerFila(turma) {
    setSelectedTurmaFila(turma);
    setModalFilaOpen(true);
    setLoadingFila(true);
    try {
      const data = await buscarFilaEspera(turma.id);
      setFilaData(data);
    } catch (err) {
      toast.error('Erro ao carregar fila de espera em tempo real.');
    } finally {
      setLoadingFila(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Módulo Acadêmico Integrado • COPER 3.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Gestão de Cursos e Turmas Extracurriculares
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Gerenciamento completo de turmas, controle automatizado de vagas com algoritmo FIFO em fila de espera e parametrização de janelas de inscrição.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setModalCursoOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-sm transition-all border border-slate-700 shadow-lg"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Novo Curso</span>
          </button>
          <button
            onClick={() => setModalTurmaOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Abrir Nova Turma</span>
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total de Cursos</span>
            <BookOpen className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-bold text-white">{cursos.length}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Turmas em Andamento</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {turmas.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Alunos na Fila FIFO</span>
            <ListOrdered className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {turmas.reduce((acc, t) => acc + (t.waitlistCount || 0), 0)}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Professores Vinculados</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{professores.length}</p>
        </div>
      </div>

      {/* Grade de Turmas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Turmas Cadastradas ({turmas.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Carregando turmas e inscrições...
          </div>
        ) : turmas.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            Nenhuma turma cadastrada no momento. Clique em "Abrir Nova Turma" para iniciar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map((turma) => {
              const activeCount = turma.activeCount || 0;
              const maxCapacity = turma.maxCapacity || 1;
              const pct = Math.min(100, Math.round((activeCount / maxCapacity) * 100));
              const waitlist = turma.waitlistCount || 0;

              return (
                <div
                  key={turma.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {turma.code || 'Turma'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          turma.status === 'FINISHED'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : turma.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {turma.status === 'FINISHED'
                          ? 'Encerrada'
                          : turma.status === 'IN_PROGRESS'
                          ? 'Em Andamento'
                          : 'Inscrições Abertas'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1 line-clamp-1">
                      {turma.course?.title || 'Curso Extracurricular'}
                    </h3>

                    <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Prof. {turma.course?.instructor?.name || 'Não informado'}</span>
                    </p>

                    {/* Barra de Ocupação de Vagas */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Vagas Ocupadas</span>
                        <span className="text-white font-bold">
                          {activeCount} / {maxCapacity} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            pct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Janelas e Prazos */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span>Frequência Mínima:</span>
                        <span className="text-slate-200 font-semibold">{turma.course?.minAttendancePct || 75}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Média Aprovação:</span>
                        <span className="text-slate-200 font-semibold">{turma.minGrade || 7.0}</span>
                      </div>
                      {turma.cancellationDeadline && (
                        <div className="flex justify-between text-amber-400/90">
                          <span>Desistência até:</span>
                          <span>{new Date(turma.cancellationDeadline).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    {waitlist > 0 ? (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <ListOrdered className="w-3.5 h-3.5" />
                        {waitlist} na fila
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Sem fila de espera</span>
                    )}

                    <button
                      onClick={() => handleVerFila(turma)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Fila FIFO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: NOVO CURSO */}
      {modalCursoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setModalCursoOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Cadastrar Novo Curso Extracurricular</span>
            </h3>

            <form onSubmit={handleCriarCurso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Curso *</label>
                <input
                  type="text"
                  placeholder="Ex: Língua Brasileira de Sinais - Libras Avançado"
                  value={cursoForm.title}
                  onChange={(e) => setCursoForm({ ...cursoForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição do Curso *</label>
                <textarea
                  placeholder="Objetivos pedagógicos, conteúdo programático e competências desenvolvidas..."
                  value={cursoForm.description}
                  onChange={(e) => setCursoForm({ ...cursoForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 h-24"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Professor Responsável *</label>
                <select
                  value={cursoForm.instructorId}
                  onChange={(e) => setCursoForm({ ...cursoForm, instructorId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Selecione o professor...</option>
                  {professores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Carga Horária (h) *</label>
                  <input
                    type="number"
                    value={cursoForm.workloadHours}
                    onChange={(e) => setCursoForm({ ...cursoForm, workloadHours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Freq. Mínima (%) *</label>
                  <input
                    type="number"
                    value={cursoForm.minAttendancePct}
                    onChange={(e) => setCursoForm({ ...cursoForm, minAttendancePct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalCursoOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? 'Cadastrando...' : 'Salvar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA TURMA */}
      {modalTurmaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalTurmaOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Abrir Nova Turma com Vagas FIFO</span>
            </h3>

            <form onSubmit={handleCriarTurma} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Curso Vinculado *</label>
                <select
                  value={turmaForm.courseId}
                  onChange={(e) => setTurmaForm({ ...turmaForm, courseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Selecione o curso...</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Prof. {c.instructor?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código da Turma</label>
                  <input
                    type="text"
                    placeholder="Ex: LIBRAS-2026.1-NOT"
                    value={turmaForm.code}
                    onChange={(e) => setTurmaForm({ ...turmaForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Capacidade de Vagas *</label>
                  <input
                    type="number"
                    value={turmaForm.maxCapacity}
                    onChange={(e) => setTurmaForm({ ...turmaForm, maxCapacity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Datas das Aulas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Início das Aulas *</label>
                  <input
                    type="date"
                    value={turmaForm.startDate}
                    onChange={(e) => setTurmaForm({ ...turmaForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Término das Aulas *</label>
                  <input
                    type="date"
                    value={turmaForm.endDate}
                    onChange={(e) => setTurmaForm({ ...turmaForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Janela de Inscrição Exata */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                  Janela de Inscrições & Prazos
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Abertura das Inscrições</label>
                    <input
                      type="datetime-local"
                      value={turmaForm.enrollmentStartDate}
                      onChange={(e) => setTurmaForm({ ...turmaForm, enrollmentStartDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Encerramento Inscrições</label>
                    <input
                      type="datetime-local"
                      value={turmaForm.enrollmentEndDate}
                      onChange={(e) => setTurmaForm({ ...turmaForm, enrollmentEndDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prazo Limite Desistência</label>
                    <input
                      type="datetime-local"
                      value={turmaForm.cancellationDeadline}
                      onChange={(e) => setTurmaForm({ ...turmaForm, cancellationDeadline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Média Mínima Aprovação</label>
                    <input
                      type="number"
                      step="0.1"
                      value={turmaForm.minGrade}
                      onChange={(e) => setTurmaForm({ ...turmaForm, minGrade: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalTurmaOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? 'Criando...' : 'Abrir Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR FILA DE ESPERA FIFO EM TEMPO REAL */}
      {modalFilaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setModalFilaOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-1">
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Algoritmo FIFO em Tempo Real</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Fila de Espera • {selectedTurmaFila?.code || 'Turma'}
              </h3>
              <p className="text-slate-400 text-xs">
                {selectedTurmaFila?.course?.title} — Vagas ativas preenchidas:{' '}
                <strong className="text-white">
                  {filaData?.activeCount ?? selectedTurmaFila?.activeCount} / {selectedTurmaFila?.maxCapacity}
                </strong>
              </p>
            </div>

            {loadingFila ? (
              <div className="py-12 text-center text-slate-400">Consultando fila de espera no banco...</div>
            ) : !filaData?.waitlist || filaData.waitlist.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium text-slate-300">Nenhum aluno na fila de espera.</p>
                <p className="text-xs text-slate-500 mt-0.5">A turma ainda possui vagas ativas disponíveis para matrícula direta.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {filaData.waitlist.map((item) => (
                  <div
                    key={item.enrollmentId}
                    className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800/90"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                        #{item.position}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {item.matricula && <span>Matrícula: {item.matricula}</span>}
                          <span>•</span>
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <span>Inscrito em:</span>
                      <p className="text-slate-300 font-medium">
                        {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>* Caso um aluno ativo desista, o #1 da fila é promovido automaticamente em transação atômica.</span>
              <button
                onClick={() => setModalFilaOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
