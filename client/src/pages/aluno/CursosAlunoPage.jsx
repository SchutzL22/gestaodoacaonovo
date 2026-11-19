import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  ListOrdered,
  LogOut,
  FileText,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  listarTurmas,
  minhasInscricoes,
  inscreverTurma,
  cancelarInscricaoTurma
} from '../../services/api';

export default function CursosAlunoPage() {
  const [activeTab, setActiveTab] = useState('inscricoes'); // 'inscricoes' | 'catalogo'
  const [inscricoes, setInscricoes] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const [resInscricoes, resTurmas] = await Promise.all([
        minhasInscricoes().catch(() => ({ enrollments: [] })),
        listarTurmas('OPEN').catch(() => ({ classrooms: [] })),
      ]);

      setInscricoes(resInscricoes?.enrollments || []);
      setTurmas(resTurmas?.classrooms || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados acadêmicos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleInscrever(turmaId) {
    setSubmittingId(turmaId);
    try {
      const res = await inscreverTurma(turmaId);
      if (res.isWaitlist) {
        toast.success(`Turma lotada! Você entrou na fila de espera na posição #${res.position}.`, {
          icon: '⏳',
          duration: 5000,
        });
      } else {
        toast.success('Inscrição confirmada com sucesso! Vaga garantida na turma.', {
          icon: '🎉',
          duration: 4000,
        });
      }
      await carregarDados();
      setActiveTab('inscricoes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Falha ao realizar inscrição.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleDesistir(turmaId, courseTitle) {
    if (
      !window.confirm(
        `Tem certeza que deseja desistir de sua vaga no curso "${courseTitle}"? Esta ação é irreversível e promoverá o próximo aluno da fila de espera imediatamente.`
      )
    ) {
      return;
    }

    setSubmittingId(turmaId);
    try {
      const res = await cancelarInscricaoTurma(turmaId);
      toast.success(res.message || 'Inscrição cancelada com sucesso.');
      await carregarDados();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar inscrição.');
    } finally {
      setSubmittingId(null);
    }
  }

  // Verifica se o aluno já possui inscrição na turma
  function getEnrollmentForClassroom(classroomId) {
    return inscricoes.find((e) => e.classroomId === classroomId);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 text-slate-100">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Portal do Estudante • Cursos Extracurriculares FMP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Meus Cursos e Frequência Acadêmica
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Inscreva-se em cursos extracurriculares (ex: Libras), acompanhe sua posição na fila de espera, faltas registradas e notas de avaliações (A1, A2 e A3).
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center">
          <button
            onClick={() => setActiveTab('inscricoes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'inscricoes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Minhas Inscrições ({inscricoes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalogo'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo Aberto ({turmas.length})</span>
          </button>
        </div>
      </div>

      {/* ABA 1: MINHAS INSCRIÇÕES & DESEMPENHO */}
      {activeTab === 'inscricoes' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              Carregando suas inscrições e diário de notas...
            </div>
          ) : inscricoes.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Você ainda não se inscreveu em nenhum curso</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
                Explore os cursos extracurriculares com vagas abertas para acumular horas complementares e emitir certificados oficiais.
              </p>
              <button
                onClick={() => setActiveTab('catalogo')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all"
              >
                Ver Cursos Disponíveis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {inscricoes.map((inscricao) => {
                const classroom = inscricao.classroom;
                const course = classroom?.course;
                const isActive = inscricao.status === 'ACTIVE';
                const isWaitlist = inscricao.status === 'WAITLIST';
                const isCompleted = inscricao.status === 'COMPLETED';
                const isCancelled = inscricao.status === 'CANCELLED';
                const isFailed = inscricao.status === 'FAILED';

                const attPct = inscricao.computedAttendancePercentage ?? inscricao.attendancePercentage ?? 100;
                const minPct = course?.minAttendancePct ?? 75;
                const isLowAttendance = attPct < minPct;

                return (
                  <div
                    key={inscricao.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Barra de Status Topo */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        isCompleted
                          ? 'bg-purple-500'
                          : isWaitlist
                          ? 'bg-amber-500'
                          : isFailed
                          ? 'bg-rose-500'
                          : 'bg-emerald-500'
                      }`}
                    />

                    <div>
                      {/* Header do Card */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                          {classroom?.code || 'Turma'}
                        </span>

                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aprovado • Concluído
                          </span>
                        )}

                        {isActive && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Matrícula Ativa (Vaga Garantida)
                          </span>
                        )}

                        {isWaitlist && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                            <ListOrdered className="w-3.5 h-3.5" />
                            Fila de Espera: Posição #{inscricao.waitlistPosition}
                          </span>
                        )}

                        {isCancelled && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-800 text-slate-400">
                            Inscrição Cancelada
                          </span>
                        )}

                        {isFailed && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Não Aprovado
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
                        {course?.title || 'Curso Extracurricular'}
                      </h2>

                      <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>Prof. {course?.instructor?.name || 'Não informado'}</span>
                        <span>•</span>
                        <span>Carga Horária: {course?.workloadHours}h</span>
                      </p>

                      {/* ALERTA: FILA DE ESPERA */}
                      {isWaitlist && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 text-xs text-amber-200">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-extrabold text-lg flex items-center justify-center shrink-0">
                              #{inscricao.waitlistPosition}
                            </div>
                            <div>
                              <strong className="block text-amber-300 text-sm mb-0.5">
                                Você está na fila de espera com algoritmo FIFO
                              </strong>
                              Assim que um aluno com vaga ativa desistir do curso, o sistema promoverá você automaticamente para vaga ativa e enviará um e-mail de confirmação.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DIÁRIO DE CLASSE DO ALUNO: FREQUÊNCIA E NOTAS */}
                      {(isActive || isCompleted || isFailed) && (
                        <div className="space-y-3 mb-4">
                          {/* Frequência */}
                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                            <div className="flex items-center justify-between mb-1.5 text-xs">
                              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                                <Percent className="w-3.5 h-3.5 text-teal-400" />
                                Frequência Acumulada
                              </span>
                              <span
                                className={`font-bold ${
                                  isLowAttendance ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {attPct}% {isLowAttendance && `(Mín. exigido: ${minPct}%)`}
                              </span>
                            </div>

                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 mb-1">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isLowAttendance ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, attPct)}%` }}
                              />
                            </div>

                            {inscricao.totalClasses > 0 && (
                              <p className="text-[11px] text-slate-400">
                                Presenças confirmadas:{' '}
                                <strong className="text-white">
                                  {inscricao.studentPresents} de {inscricao.totalClasses} aulas
                                </strong>
                              </p>
                            )}
                          </div>

                          {/* Notas A1, A2, A3 e Média Final */}
                          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                            <span className="text-xs font-semibold text-slate-300 mb-2 block flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                              Avaliações e Média Final
                            </span>

                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">A1</span>
                                <span className="text-sm font-bold text-white">
                                  {inscricao.gradeA1 !== null && inscricao.gradeA1 !== undefined
                                    ? inscricao.gradeA1.toFixed(1)
                                    : '-'}
                                </span>
                              </div>
                              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">A2</span>
                                <span className="text-sm font-bold text-white">
                                  {inscricao.gradeA2 !== null && inscricao.gradeA2 !== undefined
                                    ? inscricao.gradeA2.toFixed(1)
                                    : '-'}
                                </span>
                              </div>
                              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">A3</span>
                                <span className="text-sm font-bold text-white">
                                  {inscricao.gradeA3 !== null && inscricao.gradeA3 !== undefined
                                    ? inscricao.gradeA3.toFixed(1)
                                    : '-'}
                                </span>
                              </div>
                              <div className="bg-indigo-950/60 p-2 rounded-xl border border-indigo-800/60">
                                <span className="text-[10px] text-indigo-300 uppercase font-bold block">Média</span>
                                <span className="text-sm font-extrabold text-indigo-200">
                                  {inscricao.finalGrade !== null && inscricao.finalGrade !== undefined
                                    ? inscricao.finalGrade.toFixed(1)
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ações do Card */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                      {isCompleted && inscricao.certificate ? (
                        <a
                          href={`/validar?code=${inscricao.certificate.authHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Certificado Oficial</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {isCompleted ? 'Certificado em emissão' : 'Em andamento'}
                        </span>
                      )}

                      {(isActive || isWaitlist) && (
                        <button
                          onClick={() => handleDesistir(classroom.id, course?.title)}
                          disabled={submittingId === classroom.id}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{isWaitlist ? 'Sair da Fila' : 'Desistir da Vaga'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: CATÁLOGO DE CURSOS & TURMAS ABERTAS */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Turmas Extracurriculares Abertas para Matrícula</span>
            </h2>
          </div>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Carregando catálogo de turmas...
            </div>
          ) : turmas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Não há turmas com inscrições abertas no momento. Volte em breve!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {turmas.map((turma) => {
                const enrollment = getEnrollmentForClassroom(turma.id);
                const isEnrolledActive = enrollment?.status === 'ACTIVE';
                const isEnrolledWaitlist = enrollment?.status === 'WAITLIST';
                const isFull = turma.isFull;

                return (
                  <div
                    key={turma.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {turma.code || 'Turma'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isFull
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isFull ? 'Vagas Lotadas (Fila FIFO)' : 'Vagas Disponíveis'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1.5">{turma.course?.title}</h3>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{turma.course?.description}</p>

                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Professor:</span>
                          <span className="font-semibold">{turma.course?.instructor?.name || 'Prof. Responsável'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Carga Horária:</span>
                          <span className="font-semibold text-emerald-400">{turma.course?.workloadHours} horas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Ocupação de Vagas:</span>
                          <span className="font-semibold">
                            {turma.activeCount || 0} / {turma.maxCapacity}
                          </span>
                        </div>
                        {turma.waitlistCount > 0 && (
                          <div className="flex justify-between text-amber-400">
                            <span>Fila de espera:</span>
                            <span className="font-bold">{turma.waitlistCount} alunos</span>
                          </div>
                        )}
                        {turma.cancellationDeadline && (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Desistência até:</span>
                            <span>{new Date(turma.cancellationDeadline).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {isEnrolledActive ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Você já está matriculado nesta turma!</span>
                        </div>
                      ) : isEnrolledWaitlist ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                          <ListOrdered className="w-4 h-4" />
                          <span>Você está na fila de espera (#{enrollment.waitlistPosition})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInscrever(turma.id)}
                          disabled={submittingId === turma.id}
                          className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg ${
                            isFull
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>
                            {submittingId === turma.id
                              ? 'Processando Inscrição...'
                              : isFull
                              ? 'Entrar na Fila de Espera (FIFO)'
                              : 'Inscrever-se Agora'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
