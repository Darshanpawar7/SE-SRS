import React, { useState } from 'react';
import { TASK_STATUSES } from '../../utils/constants';
import { formatAuditTime } from '../../utils/auditTrail';

const PREVIEW_COUNT = 7;
const statusLabel = (value) => TASK_STATUSES.find(status => status.id === value)?.label ?? value;

// Read-only view of the append-only audit history. The latest records are shown
// first, and the full history is one click away, so nothing is silently hidden.
export default function AuditTrail({ records, now }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? records : records.slice(0, PREVIEW_COUNT);

  return (
    <>
      <div className="activity-feed">
        {visible.map((act, idx) => (
          <div key={act.id || idx} className="activity-item">
            <div className="activity-icon-bullet"></div>
            <div className="activity-body">
              <p className="activity-text">
                {act.type && <span className="audit-type">{act.type}</span>}{' '}
                <strong>{act.user}</strong> {act.action} <span className="highlight-tag">{act.target}</span>
                {act.from && act.to ? ` ${statusLabel(act.from)} → ${statusLabel(act.to)}` : act.to ? ` → ${statusLabel(act.to)}` : ''}
              </p>
              {act.details && <p className="activity-details" title={act.details}>{act.details}</p>}
              <time className="activity-timestamp" dateTime={act.timestamp} title={act.timestamp}>
                {formatAuditTime(act, now)}
              </time>
            </div>
          </div>
        ))}
      </div>
      <p className="card-subtitle">
        Showing {visible.length} of {records.length} records. Audit records are append-only and cannot be edited or deleted.
      </p>
      {records.length > PREVIEW_COUNT && (
        <button type="button" className="btn btn-text" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show latest only' : `Show full history (${records.length} records)`}
        </button>
      )}
    </>
  );
}
