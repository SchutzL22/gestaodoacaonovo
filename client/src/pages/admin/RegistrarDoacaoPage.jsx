import CategoriasDoacao from '../../components/CategoriasDoacao';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { listarCampanhas, registrarDoacao } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { perfil } from '../../context/perfis';
import toast from 'react-hot-toast';

const formInicial = { matricula: '', campanhaId: '', tipoItem: '', categoria: '', quantidade: '', localEntrega: '', foto: null };

export default function RegistrarDoacaoPage() {
  const { usuario } = useAuth();
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(formInicial);

  useEffect(() => {
    listarCampanhas()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.campaigns || data?.data?.campaigns || []);
        // Exibe apenas campanhas ATIVAS para registrar doações (suporte a enum novo e legado)
        setCampanhas(list.filter(c => c.statusEnum === 'ACTIVE' || ['ACTIVE', 'Ativa', 'Urgente'].includes(c.status)));
      })
      .catch(() => toast.error('Erro ao carregar as campanhas.'));
  }, []);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? files[0] : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.campanhaId || !form.tipoItem || !form.quantidade) {
      toast.error('Preencha campanha, tipo de item e quantidade.');
      return;
    }
    if (form.foto?.size > 10 * 1024 * 1024) {
      toast.error('A foto deve ter até 10 MB.');
      return;
    }
    const formulario = e.currentTarget;
    setLoading(true);
    try {
      const fd = new FormData();
      if (form.matricula.trim()) fd.append('matricula', form.matricula.trim());
      fd.append('campanhaId', form.campanhaId);
      fd.append('tipoItem', form.tipoItem.trim());
      fd.append('categoria', form.categoria);
      fd.append('quantidade', form.quantidade);
      fd.append('localEntrega', form.localEntrega);
      if (form.foto) fd.append('foto', form.foto);

      await registrarDoacao(fd);
      toast.success('Doação registrada com sucesso!');
      setForm(formInicial);
      formulario.reset();
    } catch (err) {
      toast.error(err?.response?.data?.details?.[0]?.message || err?.response?.data?.message || err?.response?.data?.erro || err.message || 'Erro ao registrar doação.');
    } finally { setLoading(false); }
  }

  return (
    <div className="page-section">
      <div className="form-container">
        <h3>Registrar Nova Doação</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {perfil(usuario) === 'COPER' && <div className="form-group">
              <label htmlFor="matricula">Matrícula do Aluno</label>
              <input id="matricula" name="matricula" type="text" placeholder="Ex: 19875"
                value={form.matricula} onChange={handleChange} />
            </div>}
            <div className="form-group">
              <label htmlFor="campanhaId">Campanha *</label>
              <select id="campanhaId" name="campanhaId" value={form.campanhaId} onChange={handleChange} required>
                <option value="">Selecione uma campanha</option>
                {campanhas.map(c => {
                  const titulo = c.title || c.titulo || '';
                  const start = c.startDate || c.dataInicio;
                  const end = c.endDate || c.dataLimite;
                  const periodo = start
                    ? ` (De ${new Date(start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até ${end ? new Date(end).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'em aberto'})`
                    : '';
                  return (
                    <option key={c.id} value={c.id}>{titulo}{periodo}</option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tipoItem">Tipo de Item *</label>
              <input id="tipoItem" name="tipoItem" type="text" placeholder="Ex: Casaco, 1kg Arroz"
                value={form.tipoItem} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="categoria">Categoria *</label>
              <select id="categoria" name="categoria" value={form.categoria} onChange={handleChange} required>
                <option value="">Selecione uma categoria</option>
                <CategoriasDoacao />
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade *</label>
              <input id="quantidade" name="quantidade" type="number" min="1"
                value={form.quantidade} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="localEntrega">Local de Entrega</label>
              <input id="localEntrega" name="localEntrega" type="text" placeholder="Ex: Central de Doações Bloco B"
                value={form.localEntrega} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="evidenciaInput">Foto / Evidência (JPEG, PNG ou WebP, até 10 MB)</label>
              <div className="file-input-wrapper">
                <input id="evidenciaInput" name="foto" type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={handleChange} />
              </div>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
            <FontAwesomeIcon icon={faFloppyDisk} />
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}
