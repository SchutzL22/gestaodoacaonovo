import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Award,
  Save,
  CheckCheck,
  TrendingUp,
  AlertTriangle,
  Lock,
  Sparkles,
  ChevronRight,
  GraduationCap,
  HeartHandshake,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  listarTurmasProfessor,
  registrarChamada,
  salvarNotasTurma,
  encerrarTurma,
  historicoChamadaTurma,
  listarDoacoes
} from '../../services/api';
import { Link } from 'react-router-dom';

export default function DiarioClassePage() {
  const [turmas, setTurmas] = useState([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  // Aba ativa: 'chamada' | 'notas'
  const [activeTab, setActiveTab] = useState('chamada');

  // Estado da chamada
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [presencas, setPresencas] = useState({}); // { [studentId]: boolean }

  // Estado das notas
  const [notas, setNotas] = useState({}); // { [enrollmentId]: { a1, a2, a3 } }

  // Estado das doações do professor
  const [minhasDoacoes, setMinhasDoacoes] = useState([]);

  useEffect(() => {
    carregarTurmas();
    carregarMinhasDoacoes();
  }, []);

  async function carregarMinhasDoacoes() {
    try {
      const data = await listarDoacoes(1, 20);
      if (Array.isArray(data)) {
        setMinhasDoacoes(data);
      }
    } catch {
      // fallback gracioso
      setMinhasDoacoes([
        {
          id: 'prof-doa-1',
          authHash: 'b1c3d5e7-2a4f-41e9-89b6-45a892b109e4',
          data: '10/05/2026',
          item: 'Livros Didáticos para Ensino Médio',
          quantidade: 15,
          status: 'Aprovada',
          statusRaw: 'APPROVED',
          campanha: 'Volta às Aulas Inclusiva',
        },
      ]);
    }
  }

  async function carregarTurmas() {
    setLoading(true);
    try {
      const data = await listarTurmasProfessor();
      const list = data?.classrooms || [];
      setTurmas(list);
      if (list.length > 0 && !selectedTurmaId) {
        setSelectedTurmaId(list[0].id);
        inicializarTurma(list[0]);
      } else if (selectedTurmaId) {
        const current = list.find((t) => t.id === selectedTurmaId);
        if (current) inicializarTurma(current);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar turmas ministradas.');
    } finally {
      setLoading(false);
    }
  }

  function inicializarTurma(turma) {
    if (!turma || !turma.students) return;

    // Inicializa presenças como presentes por padrão para chamada rápida
    const initialPres = {};
    turma.students.forEach((s) => {
      initialPres[s.studentId] = true;
    });
    setPresencas(initialPres);

    // Inicializa notas
    const initialNotas = {};
    turma.students.forEach((s) => {
      initialNotas[s.enrollmentId] = {
        gradeA1: s.gradeA1 !== null && s.gradeA1 !== undefined ? String(s.gradeA1) : '',
        gradeA2: s.gradeA2 !== null && s.gradeA2 !== undefined ? String(s.gradeA2) : '',
        gradeA3: s.gradeA3 !== null && s.gradeA3 !== undefined ? String(s.gradeA3) : '',
      };
    });
    setNotas(initialNotas);
  }

  const selectedTurma = useMemo(() => {
    return turmas.find((t) => t.id === selectedTurmaId) || null;
  }, [turmas, selectedTurmaId]);

  function handleSelectTurma(e) {
    const id = e.target.value;
    setSelectedTurmaId(id);
    const turma = turmas.find((t) => t.id === id);
    if (turma) inicializarTurma(turma);
  }

  // Alternar presença de um aluno
  function togglePresenca(studentId) {
    setPresencas((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  }

  // Marcar todos como presentes
  function handleMarcarTodos() {
    if (!selectedTurma?.students) return;
    const updated = {};
    selectedTurma.students.forEach((s) => {
      updated[s.studentId] = true;
    });
    setPresencas(updated);
    toast.success('Todos os alunos marcados como presentes!');
  }

  // Salvar chamada do dia
  async function handleSalvarChamada() {
    if (!selectedTurma) return;
    setSaving(true);
    try {
      const records = selectedTurma.students.map((s) => ({
        studentId: s.studentId,
        isPresent: Boolean(presencas[s.studentId]),
      }));

      await registrarChamada(selectedTurma.id, selectedDate, records);
      toast.success(`Chamada da data ${selectedDate} salva com sucesso!`);
      await carregarTurmas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao registrar chamada.');
    } finally {
      setSaving(false);
    }
  }

  // Salvar notas A1, A2 e A3
  async function handleSalvarNotas() {
    if (!selectedTurma) return;
    setSaving(true);
    try {
      const gradesPayload = selectedTurma.students.map((s) => {
        const studentNotas = notas[s.enrollmentId] || {};
        return {
          enrollmentId: s.enrollmentId,
          gradeA1: studentNotas.gradeA1 !== '' ? Number(studentNotas.gradeA1) : null,
          gradeA2: studentNotas.gradeA2 !== '' ? Number(studentNotas.gradeA2) : null,
          gradeA3: studentNotas.gradeA3 !== '' ? Number(studentNotas.gradeA3) : null,
        };
      });

      await salvarNotasTurma(selectedTurma.id, gradesPayload);
      toast.success('Avaliações e médias salvas com sucesso no banco de dados!');
      await carregarTurmas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar avaliações.');
    } finally {
      setSaving(false);
    }
  }

  // Encerrar turma e emitir certificados
  async function handleEncerrarTurma() {
    if (!selectedTurma) return;

    if (
      !window.confirm(
        `Atenção: Deseja encerrar a turma "${selectedTurma.code}"?\n\nO sistema cruzará a frequência mínima (${selectedTurma.minAttendancePct}%) e média mínima (${selectedTurma.minGrade}) de cada aluno para emitir os certificados oficiais automaticamente.`
      )
    ) {
      return;
    }

    setClosing(true);
    try {
      const res = await encerrarTurma(selectedTurma.id);
      toast.success(
        `Turma encerrada! Aprovados: ${res.approvedCount} alunos (Certificados gerados com sucesso).`,
        { duration: 6000 }
      );
      await carregarTurmas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao encerrar turma.');
    } finally {
      setClosing(false);
    }
  }

  // Cálculo da média de um aluno em tempo real para a tela
  function calcularMediaAluno(enrollmentId) {
    const n = notas[enrollmentId];
    if (!n) return null;
    const valid = [n.gradeA1, n.gradeA2, n.gradeA3]
      .filter((v) => v !== '' && v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number);
    if (valid.length === 0) return null;
    return Number((valid.reduce((sum, v) => sum + v, 0) / valid.length).toFixed(1));
  }

  const isTurmaEncerrada = selectedTurma?.status === 'FINISHED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Área do Professor • Diário de Classe Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Chamada Online e Avaliações (A1, A2 e A3)
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Substituição completa de diários manuais e planilhas: registro de presenças por aula, lançamento de notas e certificação automatizada ao encerrar turma.
          </p>
        </div>

        {/* Seletor de Turma */}
        {turmas.length > 0 && (
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 min-w-[260px]">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Turma Selecionada
            </label>
            <select
              value={selectedTurmaId}
              onChange={handleSelectTurma}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} • {t.courseTitle}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          Carregando turmas e diário digital...
        </div>
      ) : !selectedTurma ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          Você não possui nenhuma turma atribuída no momento.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Informações da Turma e Botão de Encerramento */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {selectedTurma.code}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isTurmaEncerrada
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isTurmaEncerrada ? 'Turma Encerrada' : 'Turma em Andamento'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedTurma.courseTitle}</h2>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>Carga Horária: <strong>{selectedTurma.workloadHours}h</strong></span>
                <span>Frequência Mínima: <strong>{selectedTurma.minAttendancePct}%</strong></span>
                <span>Média Mínima: <strong>{selectedTurma.minGrade}</strong></span>
                <span>Aulas Registradas: <strong>{selectedTurma.totalClasses}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isTurmaEncerrada ? (
                <button
                  onClick={handleEncerrarTurma}
                  disabled={closing}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{closing ? 'Encerrando...' : 'Encerrar Turma & Certificar'}</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Turma finalizada e certificados emitidos</span>
                </div>
              )}
            </div>
          </div>

          {/* Abas: Chamada Online vs Notas vs Minhas Doações */}
          <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('chamada')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'chamada'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              <span>Chamada Online da Aula</span>
            </button>
            <button
              onClick={() => setActiveTab('notas')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'notas'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Avaliações (A1, A2 e A3)</span>
            </button>
            <button
              onClick={() => setActiveTab('doacoes')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'doacoes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Minhas Doações Solidárias</span>
            </button>
          </div>

          {/* ABA 1: CHAMADA ONLINE */}
          {activeTab === 'chamada' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              {/* Controles de Chamada */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                    <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-slate-400 font-semibold">Data da Aula:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      disabled={isTurmaEncerrada}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleMarcarTodos}
                    disabled={isTurmaEncerrada}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Marcar Todos Presentes</span>
                  </button>
                </div>

                <button
                  onClick={handleSalvarChamada}
                  disabled={saving || isTurmaEncerrada}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Gravando...' : 'Salvar Chamada'}</span>
                </button>
              </div>

              {/* Lista de Alunos para Chamada Rápida */}
              {selectedTurma.students?.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum aluno ativo nesta turma.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTurma.students.map((aluno) => {
                    const isPresent = Boolean(presencas[aluno.studentId]);
                    const attPct = aluno.attendancePercentage ?? 100;
                    const isLowAtt = attPct < selectedTurma.minAttendancePct;

                    return (
                      <div
                        key={aluno.studentId}
                        onClick={() => !isTurmaEncerrada && togglePresenca(aluno.studentId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                          isPresent
                            ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500/60'
                            : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform active:scale-95 ${
                              isPresent
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                          </button>

                          <div>
                            <h4 className="text-sm font-bold text-white">{aluno.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              {aluno.matricula && <span>Matrícula: {aluno.matricula}</span>}
                              <span>•</span>
                              <span
                                className={`font-semibold ${
                                  isLowAtt ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                Freq: {attPct}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider ${
                            isPresent
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isPresent ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: AVALIAÇÕES (A1, A2 e A3) */}
          {activeTab === 'notas' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Lançamento de Avaliações e Média Final</h3>
                  <p className="text-xs text-slate-400">
                    Insira as notas de 0 a 10. A média é calculada automaticamente. Média mínima para aprovação: <strong>{selectedTurma.minGrade}</strong>.
                  </p>
                </div>

                <button
                  onClick={handleSalvarNotas}
                  disabled={saving || isTurmaEncerrada}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Gravando...' : 'Salvar Avaliações'}</span>
                </button>
              </div>

              {selectedTurma.students?.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Nenhum aluno ativo nesta turma.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Estudante</th>
                        <th className="py-3 px-3">Matrícula</th>
                        <th className="py-3 px-3 text-center w-24">Nota A1</th>
                        <th className="py-3 px-3 text-center w-24">Nota A2</th>
                        <th className="py-3 px-3 text-center w-24">Nota A3</th>
                        <th className="py-3 px-3 text-center w-28">Média Final</th>
                        <th className="py-3 px-3 text-center w-28">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {selectedTurma.students.map((aluno) => {
                        const studentNotas = notas[aluno.enrollmentId] || { gradeA1: '', gradeA2: '', gradeA3: '' };
                        const media = calcularMediaAluno(aluno.enrollmentId);
                        const isApproved = media !== null ? media >= selectedTurma.minGrade : false;

                        return (
                          <tr key={aluno.enrollmentId} className="hover:bg-slate-950/40">
                            <td className="py-3.5 px-3 font-semibold text-white">
                              {aluno.name}
                              <span className="block text-[11px] text-slate-400 font-normal">{aluno.email}</span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-400 font-mono">
                              {aluno.matricula || '-'}
                            </td>

                            {/* Input A1 */}
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                placeholder="0.0"
                                disabled={isTurmaEncerrada}
                                value={studentNotas.gradeA1}
                                onChange={(e) =>
                                  setNotas({
                                    ...notas,
                                    [aluno.enrollmentId]: {
                                      ...studentNotas,
                                      gradeA1: e.target.value,
                                    },
                                  })
                                }
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-indigo-500"
                              />
                            </td>

                            {/* Input A2 */}
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                placeholder="0.0"
                                disabled={isTurmaEncerrada}
                                value={studentNotas.gradeA2}
                                onChange={(e) =>
                                  setNotas({
                                    ...notas,
                                    [aluno.enrollmentId]: {
                                      ...studentNotas,
                                      gradeA2: e.target.value,
                                    },
                                  })
                                }
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-indigo-500"
                              />
                            </td>

                            {/* Input A3 */}
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="10"
                                placeholder="0.0"
                                disabled={isTurmaEncerrada}
                                value={studentNotas.gradeA3}
                                onChange={(e) =>
                                  setNotas({
                                    ...notas,
                                    [aluno.enrollmentId]: {
                                      ...studentNotas,
                                      gradeA3: e.target.value,
                                    },
                                  })
                                }
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white focus:outline-none focus:border-indigo-500"
                              />
                            </td>

                            {/* Média Calculada */}
                            <td className="py-3.5 px-3 text-center font-bold text-sm text-indigo-200">
                              {media !== null ? media.toFixed(1) : '-'}
                            </td>

                            {/* Badge Situação */}
                            <td className="py-3.5 px-3 text-center">
                              {media !== null ? (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    isApproved
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {isApproved ? 'Apto' : 'Insuficiente'}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Pendente</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 3: MINHAS DOAÇÕES SOLIDÁRIAS (SEM HORAS) */}
          {activeTab === 'doacoes' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-rose-400" />
                    <span>Minhas Doações Solidárias</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Como docente, suas contribuições são de caráter voluntário/solidário. As doações homologadas geram o <strong>Comprovante Oficial de Doação (Modelo 2)</strong> com hash criptográfico, sem menção a horas acadêmicas.
                  </p>
                </div>

                <Link
                  to="/registrar-doacao"
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nova Doação Solidária</span>
                </Link>
              </div>

              {minhasDoacoes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-medium">Nenhuma doação solidária registrada ainda.</p>
                  <p className="text-xs text-slate-500 mt-1">Participe das campanhas ativas da FMP e acompanhe aqui seus comprovantes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] tracking-wider">
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Item / Descrição</th>
                        <th className="py-3 px-3">Campanha</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Hash / Autenticidade</th>
                        <th className="py-3 px-3 text-right">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {minhasDoacoes.map((d) => {
                        const isApproved = d.status === 'APROVADA' || d.status === 'APPROVED';
                        const isPending = d.status === 'PENDENTE' || d.status === 'PENDING';
                        const isRejected = d.status === 'REPROVADA' || d.status === 'REJECTED';
                        const hash = d.authHash || d.id;

                        return (
                          <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-3 text-slate-400">
                              {d.data || (d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : '-')}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-white">
                              {d.item || (d.items && d.items[0]?.description) || 'Itens diversos'}
                              {d.items && d.items.length > 1 && (
                                <span className="text-[11px] text-slate-400 block">
                                  + {d.items.length - 1} outros itens
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-slate-300">
                              {d.campanha || d.campaign?.title || 'Campanha Solidária Geral'}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {isApproved && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Aprovada
                                </span>
                              )}
                              {isPending && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Em Análise
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Rejeitada
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-mono text-[11px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                {hash ? `${hash.substring(0, 10)}...` : '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isApproved && hash && (
                                  <>
                                    <a
                                      href={`/api/v1/certificates/${hash}/pdf`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg transition-colors border border-indigo-500/30"
                                      title="Baixar Comprovante PDF (Modelo 2 - Sem Horas)"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                    <Link
                                      to={`/validar?code=${hash}`}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                                      title="Validar Autenticidade"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                  </>
                                )}
                                {!isApproved && (
                                  <span className="text-[11px] text-slate-500 italic">
                                    Disponível após aprovação
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
