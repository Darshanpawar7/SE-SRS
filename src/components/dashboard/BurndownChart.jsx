import React from 'react';
import { observedSegments } from '../../utils/burndown';

export default function BurndownChart({ data }) {
  if (!data.length) return <p>No sprint dates available for a burndown chart.</p>;
  const width = Math.max(450, data.length * 44 + 80);
  const maxPoints = Math.max(1, ...data.flatMap(point => [point.ideal, point.actual ?? 0]));
  const x = index => 40 + (width - 80) * index / Math.max(data.length - 1, 1);
  const y = points => 150 - 125 * points / maxPoints;
  const segments = observedSegments(data);
  return (
    <>
      <div className="burndown-svg-wrap" style={{ overflowX: 'auto' }}>
        <svg width={width} viewBox={`0 0 ${width} 195`} style={{ minWidth: width }} role="img" aria-label="Daily sprint burndown: ideal and recorded remaining story points">
          <title>Sprint burndown — missing days have no actual data</title>
          <line x1="40" y1="20" x2="40" y2="150" stroke="#94a3b8" />
          <line x1="40" y1="150" x2={width - 30} y2="150" stroke="#94a3b8" />
          <text x="32" y="25" fill="#94a3b8" fontSize="10" textAnchor="end">{maxPoints}p</text>
          <text x="32" y="150" fill="#94a3b8" fontSize="10" textAnchor="end">0</text>
          <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" points={data.map((point, i) => `${x(i)},${y(point.ideal)}`).join(' ')} />
          {segments.map((segment, i) => (
            <polyline key={i} fill="none" stroke="#10b981" strokeWidth="3" points={segment.map(point => `${x(point.index)},${y(point.actual)}`).join(' ')} />
          ))}
          {data.map((point, i) => (
            <g key={point.date}>
              {point.actual !== null && <circle cx={x(i)} cy={y(point.actual)} r="4" fill="#10b981"><title>{point.date}: {point.actual} points remaining</title></circle>}
              <text x={x(i)} y="168" fill="#94a3b8" fontSize="10" textAnchor="middle">D{i}</text>
              <text x={x(i)} y="183" fill="#94a3b8" fontSize="9" textAnchor="middle">{point.date.slice(5)}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="card-subtitle">Actual values are recorded daily in this browser (UTC). Missing days are left blank; completed sprint history is frozen.</p>
      <details>
        <summary>Daily burndown values</summary>
        <table>
          <thead><tr><th scope="col">Date (UTC)</th><th scope="col">Ideal points</th><th scope="col">Actual points</th></tr></thead>
          <tbody>{data.map(point => <tr key={point.date}><th scope="row">{point.date}</th><td>{point.ideal}</td><td>{point.actual ?? 'Not recorded'}</td></tr>)}</tbody>
        </table>
      </details>
    </>
  );
}
