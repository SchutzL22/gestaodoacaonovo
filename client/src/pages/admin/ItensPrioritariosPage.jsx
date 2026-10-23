import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPenToSquare, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  listarItensPrioritarios, criarItemPrioritario, atualizarItemPrioritario, deletarItemPrioritario
} from '../../services/api';
import toast from 'react-hot-toast';

const URGENCIA_MAP = { NORMAL: 'Normal', MEDIA: 'Média', ALTA: 'Alta' };
const URGENCIA_BADGE = {
  NORMAL: 'badge-muted', MEDIA: 'badge-warning', ALTA: 'badge-danger'
};

export default function ItensPrioritariosPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // null = modo criação
  const [form, setForm] = useState({ nome: '', meta: '', urgencia: 'NORMAL' });

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try { setItens(await listarItensPrioritarios()); }
    catch (err) { toast.error('Erro ao carregar itens.'); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome) { toast.error('Nome é obrigatório.'); return; }
    try {
      if (editando) {
        const updated = await atualizarItemPrioritario(editando.id, {
          nome: form.nome, meta: form.meta || null, urgencia: form.urgencia
        });
        setItens(is => is.map(i => i.id === editando.id ? updated : i));
        toast.success('Item atualizado!');
      } else {
        const novo = await criarItemPrioritario({
          nome: form.nome, meta: form.meta || null, urgencia: form.urgencia
        });
        setItens(is => [novo, ...is]);
        toast.success('Item criado!');
      }
      setEditando(null);
      setForm({ nome: '', meta: '', urgencia: 'NORMAL' });
    } catch (err) { toast.error(err?.response?.data?.erro || 'Erro ao salvar item.'); }
  }

  function editarItem(item) {
    setEditando(item);
    setForm({ nome: item.nome, meta: item.meta || '', urgencia: item.urgencia });
  }

  function cancelar() {
    setEditando(null);
    setForm({ nome: '', meta: '', urgencia: 'NORMAL' });
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover este item prioritário?')) return;
    try {
      await deletarItemPrioritario(id);
      setItens(is => is.filter(i => i.id !== id));
      toast.success('Item removido!');
    } catch (err) { toast.error('Erro ao remover item.'); }
  }

  return (
    <div className="page-section">
      {/* Formulário */}
      <div className="form-container" style={{ marginBottom: '1.5rem' }}>
        <h3>{editando ? 'Editar Item Prioritário' : 'Novo Item Prioritário'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome do Item *</label>
              <input type="text" placeholder="Ex: Agasalho adulto, Arroz 1kg"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Meta (unidades)</label>
              <input type="number" min="1" placeholder="Ex: 50"
                value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Urgência</label>
              <select value={form.urgencia} onChange={e => setForm(f => ({ ...f, urgencia: e.target.value }))}>
                <option value="NORMAL">Normal</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button className="btn-primary" type="submit">
              <FontAwesomeIcon icon={faFloppyDisk} /> Salvar Item
            </button>
            {editando && (
              <button className="btn-secondary" type="button" onClick={cancelar}>
                <FontAwesomeIcon icon={faXmark} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabela */}
      <h3 style={{ marginBottom: '1rem' }}>Itens Cadastrados</h3>
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Item</th><th>Meta</th><th>Urgência</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {itens.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum item cadastrado.
                </td></tr>
              ) : itens.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 500 }}>{item.nome}</td>
                  <td>{item.meta || '—'}</td>
                  <td>
                    <span className={`badge ${URGENCIA_BADGE[item.urgencia] || 'badge-muted'}`}>
                      {URGENCIA_MAP[item.urgencia] || item.urgencia}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn-icon" style={{ color: 'var(--primary)' }} onClick={() => editarItem(item)}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeletar(item.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
