import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPenToSquare, faTrash, faXmark, faFloppyDisk, faStar, faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import {
  listarCampanhas, criarCampanha, atualizarCampanha, deletarCampanha, encerrarCampanha
} from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  'Ativa':     <span className="badge badge-success">Ativa</span>,
  'Urgente':   <span className="badge badge-danger">Urgente</span>,
  'Encerrada': <span className="badge badge-muted">Encerrada</span>,
};

const URGENCIA_BADGE = {
  'NORMAL': <span className="badge badge-muted">Normal</span>,
  'MEDIA':  <span className="badge badge-warning">Média</span>,
  'ALTA':   <span className="badge badge-danger">Alta</span>,
};

function ItemPrioritarioRow({ item, onChange, onRemove }) {
  return (
    <div className="item-dinamico">
      <input type="text" placeholder="Nome do item" value={item.nome}
        onChange={e => onChange({ ...item, nome: e.target.value })} />
      <input type="number" placeholder="Meta" value={item.meta || ''}
        onChange={e => onChange({ ...item, meta: e.target.value })} style={{ maxWidth: 80 }} />
      <select value={item.urgencia}
        onChange={e => onChange({ ...item, urgencia: e.target.value })}>
        <option value="NORMAL">Normal</option>
        <option value="MEDIA">Média</option>
        <option value="ALTA">Alta</option>
      </select>
      <button type="button" className="btn-remove-item" onClick={onRemove}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}

export default function CampanhasAdminPage() {
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  const [novaForm, setNovaForm] = useState({ titulo: '', dataLimite: '', descricao: '', itens: [] });
  const [editForm, setEditForm] = useState(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try { setCampanhas(await listarCampanhas()); }
    catch (err) { toast.error('Erro ao carregar campanhas.'); }
    finally { setLoading(false); }
  }

  async function handleCriar(e) {
    e.preventDefault();
    if (!novaForm.titulo) { toast.error('Título é obrigatório.'); return; }
    try {
      const nova = await criarCampanha({
        titulo: novaForm.titulo,
        descricao: novaForm.descricao,
        dataLimite: novaForm.dataLimite || null,
        status: 'Ativa',
        itensPrioritarios: novaForm.itens
      });
      setCampanhas(cs => [nova, ...cs]);
      setNovaForm({ titulo: '', dataLimite: '', descricao: '', itens: [] });
      toast.success('Campanha criada!');
    } catch (err) { toast.error(err?.response?.data?.erro || 'Erro ao criar campanha.'); }
  }

  function abrirEditar(c) {
    setEditando(c);
    setEditForm({ titulo: c.titulo, dataLimite: c.dataLimite || '', descricao: c.descricao, status: c.status, limiteHoras: c.limiteHoras || '', itens: [...(c.itensPrioritarios || [])] });
  }

  async function handleAtualizar(e) {
    e.preventDefault();
    try {
      const updated = await atualizarCampanha(editando.id, {
        titulo: editForm.titulo, descricao: editForm.descricao, dataLimite: editForm.dataLimite || null,
        status: editForm.status, limiteHoras: editForm.limiteHoras || null,
        itensPrioritarios: editForm.itens
      });
      setCampanhas(cs => cs.map(c => c.id === editando.id ? updated : c));
      setEditando(null);
      toast.success('Campanha atualizada!');
    } catch (err) { toast.error(err?.response?.data?.erro || 'Erro ao atualizar.'); }
  }

  async function handleEncerrar(id) {
    if (!window.confirm('Encerrar esta campanha?')) return;
    try {
      const updated = await encerrarCampanha(id);
      setCampanhas(cs => cs.map(c => c.id === id ? updated : c));
      toast.success('Campanha encerrada.');
    } catch (err) { toast.error('Erro ao encerrar.'); }
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover esta campanha?')) return;
    try {
      await deletarCampanha(id);
      setCampanhas(cs => cs.filter(c => c.id !== id));
      toast.success('Campanha removida.');
    } catch (err) { toast.error('Erro ao remover.'); }
  }

  function addItemNova() {
    setNovaForm(f => ({ ...f, itens: [...f.itens, { nome: '', meta: '', urgencia: 'NORMAL' }] }));
  }

  function updateItemNova(idx, item) {
    setNovaForm(f => ({ ...f, itens: f.itens.map((it, i) => i === idx ? item : it) }));
  }

  function removeItemNova(idx) {
    setNovaForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="page-section">
      {/* ── FORM NOVA CAMPANHA ── */}
      <div className="form-container" style={{ marginBottom: '1.5rem' }}>
        <h3><FontAwesomeIcon icon={faBullhorn} /> Nova Campanha</h3>
        <form onSubmit={handleCriar}>
          <div className="form-grid">
            <div className="form-group">
              <label>Título da Campanha *</label>
              <input type="text" placeholder="Ex: Agasalho Solidário"
                value={novaForm.titulo} onChange={e => setNovaForm(f => ({ ...f, titulo: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Data Limite (opcional)</label>
              <input type="date" value={novaForm.dataLimite}
                onChange={e => setNovaForm(f => ({ ...f, dataLimite: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Descrição</label>
            <textarea rows={3} placeholder="Descreva a campanha..."
              value={novaForm.descricao} onChange={e => setNovaForm(f => ({ ...f, descricao: e.target.value }))} />
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <div className="itens-header">
              <label><FontAwesomeIcon icon={faStar} /> Itens Prioritários</label>
              <button type="button" className="btn-add-item" onClick={addItemNova}>
                <FontAwesomeIcon icon={faPlus} /> Adicionar Item
              </button>
            </div>
            <div className="lista-itens-dinamica">
              {novaForm.itens.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
                  Nenhum item adicionado.
                </p>
              )}
              {novaForm.itens.map((item, idx) => (
                <ItemPrioritarioRow key={idx} item={item}
                  onChange={updated => updateItemNova(idx, updated)}
                  onRemove={() => removeItemNova(idx)} />
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" style={{ marginTop: '0.75rem' }}>
            <FontAwesomeIcon icon={faPlus} /> Criar Campanha
          </button>
        </form>
      </div>

      {/* ── LISTA DE CAMPANHAS ── */}
      <h3 style={{ marginBottom: '1rem' }}>Campanhas Cadastradas</h3>
      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div className="campaign-cards">
          {campanhas.length === 0 && (
            <div className="empty-state"><p>Nenhuma campanha cadastrada.</p></div>
          )}
          {campanhas.map(c => (
            <div key={c.id} className={`campaign-card ${c.urgente ? 'urgente' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 className="campaign-card-title">{c.titulo}</h4>
                {STATUS_BADGE[c.status] || <span className="badge badge-muted">{c.status}</span>}
              </div>
              {c.descricao && <p className="campaign-card-desc">{c.descricao}</p>}
              {c.dataLimite && (
                <p className="text-muted">📅 Limite: {c.dataLimite}</p>
              )}
              {c.itensPrioritarios?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <FontAwesomeIcon icon={faStar} /> Itens Prioritários:
                  </p>
                  {c.itensPrioritarios.map((item, i) => (
                    <span key={i} style={{ marginRight: '0.4rem', display: 'inline-block', marginBottom: '0.2rem' }}>
                      {URGENCIA_BADGE[item.urgencia]} {item.nome} {item.meta ? `(meta: ${item.meta})` : ''}
                    </span>
                  ))}
                </div>
              )}
              <div className="campaign-card-footer">
                <div className="campaign-card-actions">
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => abrirEditar(c)}>
                    <FontAwesomeIcon icon={faPenToSquare} /> Editar
                  </button>
                  {c.status !== 'Encerrada' && (
                    <button className="btn-danger" onClick={() => handleEncerrar(c.id)}>
                      Encerrar
                    </button>
                  )}
                  <button className="btn-danger" onClick={() => handleDeletar(c.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL EDITAR CAMPANHA ── */}
      {editando && editForm && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FontAwesomeIcon icon={faPenToSquare} /> Editar Campanha</h3>
              <button className="modal-close" onClick={() => setEditando(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleAtualizar}>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Título</label>
                  <input type="text" value={editForm.titulo} required
                    onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Data Limite</label>
                  <input type="date" value={editForm.dataLimite}
                    onChange={e => setEditForm(f => ({ ...f, dataLimite: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Ativa">Ativa</option>
                    <option value="Encerrada">Encerrada</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Limite de Horas</label>
                  <input type="number" min="0" step="0.5" value={editForm.limiteHoras}
                    onChange={e => setEditForm(f => ({ ...f, limiteHoras: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Descrição</label>
                <textarea rows={3} value={editForm.descricao}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <div className="itens-header">
                  <label><FontAwesomeIcon icon={faStar} /> Itens Prioritários</label>
                  <button type="button" className="btn-add-item"
                    onClick={() => setEditForm(f => ({ ...f, itens: [...f.itens, { nome: '', meta: '', urgencia: 'NORMAL' }] }))}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar
                  </button>
                </div>
                <div className="lista-itens-dinamica">
                  {editForm.itens.map((item, idx) => (
                    <ItemPrioritarioRow key={idx} item={item}
                      onChange={updated => setEditForm(f => ({ ...f, itens: f.itens.map((it, i) => i === idx ? updated : it) }))}
                      onRemove={() => setEditForm(f => ({ ...f, itens: f.itens.filter((_, i) => i !== idx) }))} />
                  ))}
                </div>
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
