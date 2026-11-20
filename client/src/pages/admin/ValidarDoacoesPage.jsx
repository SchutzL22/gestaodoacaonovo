import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faCircleXmark, faPenToSquare, faTrash, faXmark, faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';
import api, { listarPaginaDoacoes, validarDoacao, editarDoacao, deletarDoacao } from '../../services/api';
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

  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [revisao, setRevisao] = useState(0);
  const [erro, setErro] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listarPaginaDoacoes(pagina, 25, controller.signal)
      .then(({ doacoes, totalPages }) => {
        if (controller.signal.aborted) return;
        if (pagina > Math.max(1, totalPages)) {
          setPagina(Math.max(1, totalPages));
          return;
        }
        setLoading(false);
        setPaginas(totalPages);
        setDoacoes(doacoes);
      })
      .catch(() => { if (!controller.signal.aborted) setErro(true); });
    return () => controller.abort();
  }, [pagina, revisao]);

  function mudarPagina(proxima) {
    setLoading(true);
    setPagina(proxima);
  }

  function recarregar() {
    setErro(false);
    setLoading(true);
    setRevisao(valor => valor + 1);
  }

  async function handleValidar(id, status) {
    let motivoReprovacao = '';
    if (status === 'REPROVADA') {
      const motivo = window.prompt('Informe o motivo da reprovação:');
      if (motivo === null) return;
      motivoReprovacao = motivo.trim();
      if (!motivoReprovacao) { toast.error('Informe o motivo da reprovação.'); return; }
    }
    setSalvando(true);
    try {
      await validarDoacao(id, status, motivoReprovacao);
      recarregar();
      toast.success(`Doação ${status === 'APROVADA' ? 'aprovada' : 'reprovada'}!`);
    } catch (err) { toast.error(err?.response?.data?.message || 'Erro ao validar.'); } finally { setSalvando(false); }
  }

  async function baixarFoto(doacao) {
    try {
      const { data } = await api.get(doacao.evidenceUrl.slice('/api'.length), { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doacao.evidenceUrl.split('/').pop().replace('evidence', 'evidencia');
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error('Erro ao baixar a foto.'); }
  }

  async function handleEditar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await editarDoacao(editando.id, {
        quantidade: Number(editForm.quantidade),
        tipoItem: editForm.tipoItem,
        itemId: editForm.itemId,
        matricula: editForm.matricula
      });
      recarregar();
      setEditando(null);
      toast.success('Doação atualizada!');
    } catch (err) { toast.error(err?.response?.data?.details?.[0]?.message || err?.response?.data?.message || err?.response?.data?.erro || 'Erro ao editar.'); } finally { setSalvando(false); }
  }

  async function handleDeletar(id) {
    if (!window.confirm('Remover esta doação?')) return;
    setSalvando(true);
    try {
      await deletarDoacao(id);
      recarregar();
      toast.success('Doação removida!');
    } catch { toast.error('Erro ao remover.'); } finally { setSalvando(false); }
  }

  function abrirEditar(doacao) {
    setEditando(doacao);
    setEditForm({ itemId: doacao.items?.[0]?.id, matricula: doacao.matricula || '', tipoItem: doacao.item, quantidade: doacao.quantidade });
  }

  return (
    <div className="page-section">
      {erro ? (
        <div role="alert">Não foi possível carregar as doações. <button onClick={recarregar}>Tentar novamente</button></div>
      ) : loading ? (
        <div className="loading-container"><div className="spinner" /><span>Carregando...</span></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th><th>Doador</th><th>Itens e quantidades</th>
                <th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {doacoes.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma doação registrada.
                </td></tr>
              ) : doacoes.map(d => (
                <tr key={d.id}>
                  <td>{d.data}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.aluno || '—'}</div>
                    {d.matricula && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{d.matricula}</div>}
                  </td>
                  <td>
                    {d.items?.length ? d.items.map(item => (
                      <div key={item.id}>{item.quantity} {item.unit} · {item.description}</div>
                    )) : <div>{d.quantidade} × {d.item}</div>}
                    {d.evidenceUrl?.startsWith(`/api/donations/${d.id}/evidence.`) &&
                      <button type="button" onClick={() => baixarFoto(d)}>Baixar foto</button>}
                  </td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {d.status === 'Pendente' && <>
                        <button disabled={salvando} className="btn-success" aria-label="Aprovar doação" onClick={() => handleValidar(d.id, 'APROVADA')}>
                          <FontAwesomeIcon icon={faCircleCheck} />
                        </button>
                        <button disabled={salvando} className="btn-danger" aria-label="Reprovar doação" onClick={() => handleValidar(d.id, 'REPROVADA')}>
                          <FontAwesomeIcon icon={faCircleXmark} />
                        </button>
                      <button disabled={salvando} className="btn-icon" title="Editar" onClick={() => abrirEditar(d)}
                        style={{ color: 'var(--primary)' }}>
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button disabled={salvando} className="btn-icon" title="Remover" onClick={() => handleDeletar(d.id)}
                        style={{ color: 'var(--danger)' }}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginas > 1 && <nav aria-label="Páginas de doações" className="flex items-center justify-center gap-4 p-4">
            <button disabled={salvando || pagina === 1} onClick={() => mudarPagina(pagina - 1)}>Anterior</button>
            <span>Página {pagina} de {paginas}</span>
            <button disabled={salvando || pagina >= paginas} onClick={() => mudarPagina(pagina + 1)}>Próxima</button>
          </nav>}
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
              {editando.items?.length > 1 && <div className="form-group">
                <label htmlFor="item-edicao">Item a editar</label>
                <select id="item-edicao" value={editForm.itemId} onChange={e => {
                  const item = editando.items.find(i => i.id === e.target.value);
                  setEditForm(f => ({ ...f, itemId: item.id, tipoItem: item.description, quantidade: item.quantity }));
                }}>
                  {editando.items.map(i => <option key={i.id} value={i.id}>{i.description}</option>)}
                </select>
              </div>}
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
                <input type="number" min="0" step="any" value={editForm.quantidade} required
                  onChange={e => setEditForm(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <button disabled={salvando} className="btn-primary" type="submit">
                <FontAwesomeIcon icon={faFloppyDisk} /> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
