import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faCircleXmark, faPenToSquare, faTrash, faXmark, faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';
import { listarDoacoes, validarDoacao, editarDoacao, deletarDoacao } from '../../services/api';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
  const cfg = {
    'Pendente':   { cls: 'badge-warning', label: 'Pendente' },
    'Aprovada':   { cls: 'badge-success', label: 'Aprovada' },
    'Reprovada':  { cls: 'badge-danger',  label: 'Reprovada' },
    'Aguardando Correção': { cls: 'badge-primary', label: 'Ag. Correção' }
  };
  const { cls = 'badge-muted', label = status } = cfg[status] || {};
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ValidarDoacoesPage() {
  const [doacoes, setDoacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ matricula: '', tipoItem: '', quantidade: '' });

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      setDoacoes(await listarDoacoes());
    } catch (err) { toast.error('Erro ao carregar doações.'); }
    finally { setLoading(false); }
  }

  async function handleValidar(id, status) {
    let motivoReprovacao = '';
    if (status === 'REPROVADA') {
      motivoReprovacao = window.prompt('Informe o motivo da reprovação:') || '';
    }
    try {
      const updated = await validarDoacao(id, status, motivoReprovacao);
      setDoacoes(ds => ds.map(d => d.id === id ? updated : d));
      toast.success(`Doação ${status === 'APROVADA' ? 'aprovada' : 'reprovada'}!`);
    } catch (err) { toast.error(err?.response?.data?.erro || 'Erro ao validar.'); }
  }

  async function handleEditar(e) {
    e.preventDefault();
    try {
      const updated = await editarDoacao(editando.id, {
        quantidade: Number(editForm.quantidade),
        tipoItem: editForm.tipoItem,
        matricula: editForm.matricula
      });
      setDoacoes(ds => ds.map(d => d.id === editando.id ? updated : d));
      setEditando(null);
      toast.success('Doação atualizada!');
    } catch (err) { toast.error(err?.response?.data?.erro || 'Erro ao editar.'); }
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover esta doação?')) return;
    try {
      await deletarDoacao(id);
      setDoacoes(ds => ds.filter(d => d.id !== id));
      toast.success('Doação removida!');
    } catch (err) { toast.error('Erro ao remover.'); }
  }

  function abrirEditar(doacao) {
    setEditando(doacao);
    setEditForm({ matricula: doacao.matricula || '', tipoItem: doacao.tipoItem, quantidade: doacao.quantidade });
  }

  return (
    <div className="page-section">
      {loading ? (
        <div className="loading-container"><div className="spinner" /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th><th>Aluno</th><th>Item</th>
                <th>Qtd</th><th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {doacoes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma doação registrada.
                </td></tr>
              ) : doacoes.map(d => (
                <tr key={d.id}>
                  <td>{d.data}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.aluno || '—'}</div>
                    {d.matricula && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{d.matricula}</div>}
                  </td>
                  <td>{d.item}</td>
                  <td>{d.quantidade}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {d.status === 'Pendente' && <>
                        <button className="btn-success" onClick={() => handleValidar(d.id, 'APROVADA')}>
                          <FontAwesomeIcon icon={faCircleCheck} />
                        </button>
                        <button className="btn-danger" onClick={() => handleValidar(d.id, 'REPROVADA')}>
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </button>
                      </>}
                      <button className="btn-icon" title="Editar" onClick={() => abrirEditar(d)}
                        style={{ color: 'var(--primary)' }}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button className="btn-icon" title="Remover" onClick={() => handleDeletar(d.id)}
                        style={{ color: 'var(--danger)' }}>
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

      {/* Modal de edição */}
      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FontAwesomeIcon icon={faPenToSquare} /> Editar Doação</h3>
              <button className="modal-close" onClick={() => setEditando(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleEditar}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Matrícula do Aluno</label>
                <input type="text" value={editForm.matricula}
                  onChange={e => setEditForm(f => ({ ...f, matricula: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Tipo de Item *</label>
                <input type="text" value={editForm.tipoItem} required
                  onChange={e => setEditForm(f => ({ ...f, tipoItem: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label>Quantidade *</label>
                <input type="number" min="1" value={editForm.quantidade} required
                  onChange={e => setEditForm(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <button className="btn-primary" type="submit">
                <FontAwesomeIcon icon={faFloppyDisk} /> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
