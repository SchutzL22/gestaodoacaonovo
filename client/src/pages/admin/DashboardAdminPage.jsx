import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf, faAward } from '@fortawesome/free-solid-svg-icons';
import { listarDoacoes } from '../../services/api';

export default function DashboardAdminPage() {
  const [pendentes, setPendentes] = useState(0);
  const [horas, setHoras] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listarDoacoes()
      .then(doacoes => {
        setPendentes(doacoes.filter(d => d.status === 'Pendente').length);
        setHoras(doacoes.reduce((acc, d) => acc + (d.horas || 0), 0));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-section">
      <div className="page-title">
        Dashboard
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando...</span>
        </div>
      ) : (
        <div className="cards-grid">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Doações Pendentes</h3>
              <p className="stat-value text-warning">{pendentes}</p>
            </div>
            <FontAwesomeIcon icon={faHourglassHalf} style={{ fontSize: '2rem', color: '#F2994A', opacity: 0.6 }} />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Horas Concedidas</h3>
              <p className="stat-value text-success">{horas.toFixed(1)}h</p>
            </div>
            <FontAwesomeIcon icon={faAward} style={{ fontSize: '2rem', color: '#27AE60', opacity: 0.6 }} />
          </div>
        </div>
      )}
    </div>
  );
}
