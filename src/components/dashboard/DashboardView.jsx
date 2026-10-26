import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { TEAM_MEMBERS, TASK_STATUSES } from '../../utils/constants';

import { generateRecordedBurndown } from '../../utils/burndown';
import BurndownChart from './BurndownChart';
import KpiCards from './KpiCards';
import WorkloadList from './WorkloadList';

export default function DashboardView({ onNavigateKanban }) {
  const { activeSprintTasks, sprintMetrics, activities, sprints, activeSprintId, burndownHistory } = useProject();
  const activeSprint = sprints.find(s => s.id === activeSprintId);
  const burndown = generateRecordedBurndown(activeSprint, burndownHistory[activeSprintId]);

  return (
    <div className="dashboard-page">
      {/* Top Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Executive Visibility & Metrics</h2>
          <p className="view-subtitle">
            Agile visibility, team workload balancing, velocity tracking, and audit feed for {activeSprint?.name}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onNavigateKanban}>
          <span>View Kanban Board</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <KpiCards metrics={sprintMetrics} />

      {/* Visual Analytics Grid */}
      <div className="charts-grid">
        {/* Burndown Chart Card */}
        <div className="chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Sprint Burndown Velocity</h3>
              <p className="card-subtitle">Ideal guideline vs actual points remaining</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot ideal"></span> Ideal</span>
              <span className="legend-item"><span className="legend-dot actual"></span> Actual</span>
            </div>
          </div>

          <BurndownChart data={burndown} />
        </div>

        {/* Workflow Status Distribution */}
        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Workflow Distribution</h3>
            <p className="card-subtitle">Tasks in each stage</p>
          </div>
          <div className="status-bars-list">
            {TASK_STATUSES.map(st => {
              const count = activeSprintTasks.filter(t => t.status === st.id).length;
              const pct = activeSprintTasks.length > 0 ? Math.round((count / activeSprintTasks.length) * 100) : 0;
              return (
                <div key={st.id} className="status-bar-row">
                  <div className="status-bar-info">
                    <span className="status-dot" style={{ backgroundColor: st.color }}></span>
                    <span className="status-name">{st.label}</span>
                    <span className="status-count">{count} items ({pct}%)</span>
                  </div>
                  <div className="mini-progress-track">
                    <div 
                      className="mini-progress-fill" 
                      style={{ width: `${pct}%`, backgroundColor: st.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Workload by Teammate & Audit Feed */}
      <div className="grid-2-col">
        {/* Team 11 Workload Allocation */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Team 11 Capacity & Workload</h3>
              <p className="card-subtitle">Story points assigned vs completed per student</p>
            </div>
          </div>
          <WorkloadList tasks={activeSprintTasks} members={TEAM_MEMBERS} />
        </div>

        {/* Real-time Activity Log (Audit Trail) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Real-Time Audit Trail</h3>
              <p className="card-subtitle">Project visibility & accountability log</p>
            </div>
          </div>
          <div className="activity-feed">
            {activities.slice(0, 7).map((act, idx) => (
              <div key={act.id || idx} className="activity-item">
                <div className="activity-icon-bullet"></div>
                <div className="activity-body">
                  <p className="activity-text">
                    <strong>{act.user}</strong> {act.action} <span className="highlight-tag">{act.target}</span> {act.to ? `→ ${act.to}` : ''}
                  </p>
                  <span className="activity-timestamp">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

