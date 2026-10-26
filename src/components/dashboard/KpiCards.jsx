import React from 'react';
import { buildKpiCards } from '../../utils/kpis';

export default function KpiCards({ metrics }) {
  return (
    <div className="stats-grid">
      {buildKpiCards(metrics).map(card => (
        <div key={card.id} className="stat-card">
          <div className="stat-label">{card.label}</div>
          {card.unit === '%' ? (
            <div className={`stat-value ${card.tone}`}>{card.value}%</div>
          ) : (
            <div className={`stat-value ${card.tone}`}>{card.value} <span className="stat-unit">{card.unit}</span></div>
          )}
          {card.progress === undefined ? (
            <div className="stat-meta">{card.meta}</div>
          ) : (
            <div
              className="progress-bar-container"
              role="progressbar"
              aria-label={card.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={card.progress}
            >
              <div className="progress-bar-fill" style={{ width: `${card.progress}%` }}></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
