import React from 'react';
import { summarizeWorkload } from '../../utils/estimation';

export default function WorkloadList({ tasks, members }) {
  const summary = summarizeWorkload(tasks, members);

  return (
    <div className="workload-list">
      {summary.members.map(m => (
        <div key={m.id} className="workload-item">
          <div className="member-avatar" style={{ backgroundColor: m.color }}>
            {m.initials}
          </div>
          <div className="workload-details">
            <div className="workload-name-row">
              <span className="member-name">{m.name}</span>
              <span className="member-usn">{m.usn}</span>
            </div>
            <div className="workload-metrics-row">
              <span>{m.taskCount} tasks • {m.assignedPoints} story points assigned</span>
              <span className="text-emerald">{m.completedPoints} pts done ({m.completionRate}%)</span>
            </div>
            <div
              className="mini-progress-track"
              role="progressbar"
              aria-label={`${m.name} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={m.completionRate}
            >
              <div
                className="mini-progress-fill"
                style={{ width: `${m.completionRate}%`, backgroundColor: m.color }}
              ></div>
            </div>
          </div>
        </div>
      ))}
      {summary.unassignedTasks > 0 && (
        <p className="card-subtitle">
          Unassigned: {summary.unassignedTasks} tasks • {summary.unassignedPoints} story points not yet owned by a team member
        </p>
      )}
    </div>
  );
}
