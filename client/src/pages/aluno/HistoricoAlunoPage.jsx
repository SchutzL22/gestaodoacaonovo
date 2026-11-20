import { useEffect, useState } from 'react';
import { Award, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function HistoricoAlunoPage() {
  const [certificados, setCertificados] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(0);
  const [estado, setEstado] = useState('carregando');

  useEffect(() => {
    const controller = new AbortController();
    api.get('/certificates', { params: { page: pagina }, signal: controller.signal })
      .then(({ data }) => {
        setCertificados(data.data.certificates);
        setPaginas(data.data.pagination.totalPages);
        setEstado('pronto');
      })
      .catch(() => { if (!controller.signal.aborted) setEstado('erro'); });
    return () => controller.abort();
  }, [pagina]);

  function mudarPagina(proxima) {
    setEstado('carregando');
    setPagina(proxima);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Histórico de Documentos e Certificados</h1>
        <p className="text-xs text-slate-400 mt-1">
          Consulte seus comprovantes emitidos, baixe o PDF oficial ou valide a autenticidade online.
        </p>
      </div>

      <div className="space-y-4">
        {estado === 'carregando' && <p role="status">Carregando certificados…</p>}
        {estado === 'erro' && <p role="alert">Não foi possível carregar seus certificados.</p>}
        {estado === 'pronto' && !certificados.length && <p>Nenhum certificado emitido até o momento.</p>}
        {estado === 'pronto' && certificados.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Emitido
                </span>
                <h3 className="font-semibold text-white text-sm mt-1">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">Código Hash: {c.authHash}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span>Emitido em: {new Date(c.issuedAt).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span className="font-bold text-teal-400">{c.hours} horas computadas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <a className="text-teal-400 text-xs" href={`/api/certificates/${encodeURIComponent(c.authHash)}/pdf`}>Baixar PDF</a>
              <Link
                to={`/validar?code=${c.authHash}`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>Validar</span>
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              </Link>
            </div>
          </div>
        ))}
        {paginas > 1 && <nav aria-label="Páginas do histórico" className="flex gap-4">
          <button disabled={pagina === 1} onClick={() => mudarPagina(pagina - 1)}>Anterior</button>
          <span>{pagina} de {paginas}</span>
          <button disabled={pagina >= paginas} onClick={() => mudarPagina(pagina + 1)}>Próxima</button>
        </nav>}
      </div>
    </div>
  );
}
