import React from 'react';
import { getDistinctLabels } from '../../utils/labels';

// One pill per distinct label on a task card.
export default function LabelPills({ labels }) {
  const distinct = getDistinctLabels(labels);
  if (distinct.length === 0) return null;

  return (
    <div className="task-labels">
      {distinct.map(label => (
        <span key={label} className="label-tag">#{label}</span>
      ))}
    </div>
  );
}
