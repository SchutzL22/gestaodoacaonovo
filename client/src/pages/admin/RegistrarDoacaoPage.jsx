import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { listarCampanhas, registrarDoacao, listarUsuarios } from '../../services/api';
import toast from 'react-hot-toast';

export default function RegistrarDoacaoPage() {
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    matricula: '', campanhaId: '', tipoItem: '', quantidade: '', localEntrega: '', foto: null
  });

  useEffect(() => {
    listarCampanhas()
      .then(cs => setCampanhas(cs.filter(c => c.status !== 'Encerrada')))
      .catch(console.error);
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
    setLoading(true);
    try {
      // Resolve matrícula → alunoId se preenchida
      let alunoId = null;
      if (form.matricula.trim()) {
        const usuarios = await listarUsuarios();
        const aluno = usuarios.find(u => u.matricula === form.matricula.trim());
        if (!aluno) { toast.error(`Aluno não encontrado: matrícula ${form.matricula}`); setLoading(false); return; }
        alunoId = aluno.id;
      }

      const fd = new FormData();
      if (alunoId) fd.append('alunoId', alunoId);
      fd.append('campanhaId', form.campanhaId);
      fd.append('tipoItem', form.tipoItem);
      fd.append('quantidade', form.quantidade);
      fd.append('localEntrega', form.localEntrega);
      if (form.foto) fd.append('foto', form.foto);

      await registrarDoacao(fd);
      toast.success('Doação registrada com sucesso!');
      setForm({ matricula: '', campanhaId: '', tipoItem: '', quantidade: '', localEntrega: '', foto: null });
      // Limpa input file
      document.getElementById('evidenciaInput').value = '';
    } catch (err) {
      toast.error(err?.response?.data?.erro || err.message || 'Erro ao registrar doação.');
    } finally { setLoading(false); }
  }

  return (
    <div className="page-section">
      <div className="form-container">
        <h3>Registrar Nova Doação</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Matrícula do Aluno</label>
              <input name="matricula" type="text" placeholder="Ex: 19875"
                value={form.matricula} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Campanha *</label>
              <select name="campanhaId" value={form.campanhaId} onChange={handleChange} required>
                <option value="">Selecione uma campanha</option>
                {campanhas.map(c => (
                  <option key={c.id} value={c.id}>{c.titulo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo de Item *</label>
              <input name="tipoItem" type="text" placeholder="Ex: Casaco, 1kg Arroz"
                value={form.tipoItem} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Quantidade *</label>
              <input name="quantidade" type="number" min="1"
                value={form.quantidade} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Local de Entrega</label>
              <input name="localEntrega" type="text" placeholder="Ex: Central de Doações Bloco B"
                value={form.localEntrega} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Foto / Evidência</label>
              <div className="file-input-wrapper">
                <input id="evidenciaInput" name="foto" type="file" accept="image/*"
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
