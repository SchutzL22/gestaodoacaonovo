import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPenToSquare, faTrash, faXmark, faFloppyDisk, faStar, faBullhorn
} from '@fortawesome/free-solid-svg-icons';
import {
  listarCampanhas, criarCampanha, atualizarCampanha, deletarCampanha, encerrarCampanha
} from '../../services/api';
import toast from 'react-hot-toast';

/** Formata ISO string para YYYY-MM-DD (valor de input[type=date]) */
function toDateInput(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return ''; }
}

/** Formata ISO string para DD/MM/AAAA (exibição) */
function fmt(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); } catch { return dateStr; }
}

const STATUS_BADGE = {
  'ACTIVE':    <span className="badge badge-success">Ativa</span>,
  'FUTURE':    <span className="badge" style={{ background: 'var(--blue-soft,#1e3a5f)', color: '#7dd3fc' }}>Futura</span>,
  'CLOSED':    <span className="badge badge-muted">Encerrada</span>,
  // legado
  'Ativa':     <span className="badge badge-success">Ativa</span>,
  'Futura':    <span className="badge" style={{ background: 'var(--blue-soft,#1e3a5f)', color: '#7dd3fc' }}>Futura</span>,
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

  const NOVA_FORM_DEFAULT = { titulo: '', dataInicio: '', dataLimite: '', descricao: '', limiteHoras: '', itens: [] };
  const [novaForm, setNovaForm] = useState(NOVA_FORM_DEFAULT);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const data = await listarCampanhas();
      // A API pode retornar array ou { campaigns: [...] }
      const list = Array.isArray(data) ? data : (data?.campaigns || data?.data?.campaigns || []);
      setCampanhas(list);
    }
    catch (err) { toast.error('Erro ao carregar campanhas.'); }
    finally { setLoading(false); }
  }

  async function handleCriar(e) {
    e.preventDefault();
    if (!novaForm.titulo) { toast.error('Título é obrigatório.'); return; }
    if (!novaForm.dataInicio) { toast.error('Data de início é obrigatória.'); return; }
    if (novaForm.dataLimite && novaForm.dataLimite < novaForm.dataInicio) {
      toast.error('A data limite deve ser igual ou posterior à data de início.');
      return;
    }
    try {
      const payload = {
        title: novaForm.titulo,
        description: novaForm.descricao,
        startDate: novaForm.dataInicio,
        endDate: novaForm.dataLimite || null,
        hoursLimit: novaForm.limiteHoras ? parseFloat(novaForm.limiteHoras) : null,
        priorityItems: novaForm.itens.filter(i => i.nome).map(i => ({
          name: i.nome,
          goal: i.meta ? parseFloat(i.meta) : null,
          urgencyLevel: i.urgencia || 'NORMAL',
          isUrgent: i.urgencia === 'ALTA',
        })),
      };
      const res = await criarCampanha(payload);
      const nova = res?.data?.campaign || res?.campaign || res;
      setCampanhas(cs => [nova, ...cs]);
      setNovaForm(NOVA_FORM_DEFAULT);
      toast.success('Campanha criada!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.erro || 'Erro ao criar campanha.';
      toast.error(msg);
    }
  }

  function abrirEditar(c) {
    setEditando(c);
    setEditForm({
      titulo: c.title || c.titulo || '',
      dataInicio: toDateInput(c.startDate || c.dataInicio),
      dataLimite: toDateInput(c.endDate || c.dataLimite),
      descricao: c.description || c.descricao || '',
      limiteHoras: c.hoursLimit || c.limiteHoras || '',
      itens: (c.priorityItems || c.itensPrioritarios || []).map(i => ({
        nome: i.name || i.nome || '',
        meta: i.goal || i.meta || '',
        urgencia: i.urgencyLevel || i.urgencia || 'NORMAL',
      })),
    });
  }

  async function handleAtualizar(e) {
    e.preventDefault();
    if (editForm.dataLimite && editForm.dataInicio && editForm.dataLimite < editForm.dataInicio) {
      toast.error('A data limite deve ser igual ou posterior à data de início.');
      return;
    }
    try {
      const payload = {
        title: editForm.titulo,
        description: editForm.descricao,
        startDate: editForm.dataInicio || undefined,
        endDate: editForm.dataLimite || null,
        hoursLimit: editForm.limiteHoras ? parseFloat(editForm.limiteHoras) : null,
        priorityItems: editForm.itens.filter(i => i.nome).map(i => ({
          name: i.nome,
          goal: i.meta ? parseFloat(i.meta) : null,
          urgencyLevel: i.urgencia || 'NORMAL',
          isUrgent: i.urgencia === 'ALTA',
        })),
      };
      const res = await atualizarCampanha(editando.id, payload);
      const updated = res?.data?.campaign || res?.campaign || res;
      setCampanhas(cs => cs.map(c => c.id === editando.id ? { ...c, ...updated } : c));
      setEditando(null);
      toast.success('Campanha atualizada!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.erro || 'Erro ao atualizar.';
      toast.error(msg);
    }
  }

  async function handleEncerrar(id) {
    if (!window.confirm('Encerrar esta campanha?')) return;
    try {
      const res = await encerrarCampanha(id);
      const updated = res?.data?.campaign || res?.campaign || res;
      setCampanhas(cs => cs.map(c => c.id === id ? { ...c, status: 'CLOSED', ...updated } : c));
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
              <label>Data de Início *</label>
              <input type="date" value={novaForm.dataInicio} required
                onChange={e => setNovaForm(f => ({ ...f, dataInicio: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Data Limite (opcional)</label>
              <input type="date" value={novaForm.dataLimite}
                min={novaForm.dataInicio || undefined}
                onChange={e => setNovaForm(f => ({ ...f, dataLimite: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Limite de Horas</label>
              <input type="number" min="0" step="0.5" value={novaForm.limiteHoras}
                onChange={e => setNovaForm(f => ({ ...f, limiteHoras: e.target.value }))} />
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
          {campanhas.map(c => {
            const titulo = c.title || c.titulo || '(sem título)';
            const descricao = c.description || c.descricao;
            const startDate = c.startDate || c.dataInicio;
            const endDate = c.endDate || c.dataLimite;
            const priorityItems = c.priorityItems || c.itensPrioritarios || [];
            return (
              <div key={c.id} className={`campaign-card ${c.isUrgent || c.urgente ? 'urgente' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 className="campaign-card-title">{titulo}</h4>
                  {STATUS_BADGE[c.status] || <span className="badge badge-muted">{c.status}</span>}
                </div>
                {descricao && <p className="campaign-card-desc">{descricao}</p>}
                <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
                  📅 De {fmt(startDate)} até {endDate ? fmt(endDate) : 'em aberto'}
                </p>
                {c.hoursLimit && (
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>⏱ Limite: {c.hoursLimit}h</p>
                )}
                {priorityItems.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <FontAwesomeIcon icon={faStar} /> Itens Prioritários:
                    </p>
                    {priorityItems.map((item, i) => (
                      <span key={i} style={{ marginRight: '0.4rem', display: 'inline-block', marginBottom: '0.2rem' }}>
                        {URGENCIA_BADGE[item.urgencyLevel || item.urgencia] || null} {item.name || item.nome}{' '}
                        {(item.goal || item.meta) ? `(meta: ${item.goal || item.meta})` : ''}
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
                    {c.status !== 'CLOSED' && c.status !== 'Encerrada' && (
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
            );
          })}
        </div>
      )}

      {/* ── MODAL EDITAR CAMPANHA ── */}
      {editando && editForm && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
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
                  <label>Data de Início</label>
                  <input type="date" value={editForm.dataInicio}
                    onChange={e => setEditForm(f => ({ ...f, dataInicio: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Data Limite</label>
                  <input type="date" value={editForm.dataLimite}
                    min={editForm.dataInicio || undefined}
                    onChange={e => setEditForm(f => ({ ...f, dataLimite: e.target.value }))} />
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
