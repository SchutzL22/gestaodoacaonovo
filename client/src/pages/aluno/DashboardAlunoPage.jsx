import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Award, Clock, BookOpen, HeartHandshake, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DashboardAlunoPage() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState({
    horasTotais: 35,
    doacoesCount: 3,
    cursosAtivos: 1,
    filaEsperaCount: 1,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-6xl mx-auto">
      {/* Boas-Vindas */}
      <div className="bg-gradient-to-r from-teal-900/60 to-slate-900 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
            Painel do Aluno • COPER 3.0
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Olá, {usuario?.nome || 'Estudante'}!
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xl">
            Acompanhe seu progresso de horas complementares, doações sociais entregues e seus cursos extracurriculares.
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Saldo de Horas</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.horasTotais}h registradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Cursos Ativos</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.cursosAtivos} turma</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Doações Validadas</span>
          <p className="text-2xl font-bold text-white mt-1">{stats.doacoesCount} entregas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Certificados</span>
          <p className="text-2xl font-bold text-white mt-1">2 emitidos</p>
        </div>
      </div>

      {/* Ações e Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-2">Meus Cursos e Turmas</h3>
          <p className="text-xs text-slate-400 mb-4">
            Turma de Libras Básico 2026.1 - Status: <strong className="text-emerald-400">Ativo</strong>
          </p>
          <Link
            to="/historico"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            Ver histórico completo de certificados <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-2">Validação Pública de Documentos</h3>
          <p className="text-xs text-slate-400 mb-4">
            Audite declarações e certificados com QR Code e Hash estilo Unisul.
          </p>
          <Link
            to="/validar"
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            Acessar página de validação pública <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
