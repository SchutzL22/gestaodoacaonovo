import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, IdCard, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditarPerfilPage() {
  const { usuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome || 'Lucas Alexandre');
  const [email] = useState(usuario?.email || 'aluno@coper.edu.br');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Perfil atualizado com sucesso!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Editar Perfil</h1>
        <p className="text-xs text-slate-400 mt-1">Gerencie suas credenciais e dados cadastrais no COPER 3.0.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nome Completo</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">E-mail Institucional</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nova Senha (opcional)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Digite apenas se desejar alterar"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-600/20 mt-4"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </form>
    </div>
  );
}
