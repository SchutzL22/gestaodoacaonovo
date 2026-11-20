import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf, faAward } from '@fortawesome/free-solid-svg-icons';
import { buscarRelatorio } from '../../services/api';

export default function DashboardAdminPage() {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    buscarRelatorio(controller.signal)
      .then(setResumo)
      .catch(() => { if (!controller.signal.aborted) setErro(true); });
    return () => controller.abort();
  }, []);

  return (
    <div className="page-section">
      <div className="page-title">
        Resumo de doações · últimos 2 anos
      </div>

      {erro ? <p role="alert">Não foi possível carregar o resumo de doações.</p> : !resumo ? (
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando...</span>
        </div>
      ) : (
        <div className="cards-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Doações Pendentes</h3>
              <p className="stat-value text-warning">{resumo.totalPendentes}</p>
            </div>
            <FontAwesomeIcon icon={faHourglassHalf} style={{ fontSize: '2rem', color: '#F2994A', opacity: 0.6 }} />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Horas Concedidas</h3>
              <p className="stat-value text-success">{resumo.totalHoras.toLocaleString('pt-BR')}h</p>
            </div>
            <FontAwesomeIcon icon={faAward} style={{ fontSize: '2rem', color: '#27AE60', opacity: 0.6 }} />
          </div>
        </div>
      )}
    </div>
  );
}
