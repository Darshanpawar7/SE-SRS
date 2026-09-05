import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { TEAM_MEMBERS, TASK_STATUSES } from '../../utils/constants';
import { calculateMemberWorkload, generateBurndownData } from '../../utils/estimation';

export default function DashboardView({ onNavigateKanban }) {
  const { activeSprintTasks, sprintMetrics, activities, sprints, activeSprintId } = useProject();
  const activeSprint = sprints.find(s => s.id === activeSprintId) || sprints[0];
  const workload = calculateMemberWorkload(activeSprintTasks, TEAM_MEMBERS);
  const burndown = generateBurndownData(sprintMetrics.totalStoryPoints, sprintMetrics.completedStoryPoints);

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
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Story Points</div>
          <div className="stat-value text-indigo">{sprintMetrics.totalStoryPoints} <span className="stat-unit">pts</span></div>
          <div className="stat-meta">{sprintMetrics.totalTasks} tasks in active scope</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Delivered Velocity</div>
          <div className="stat-value text-emerald">{sprintMetrics.completedStoryPoints} <span className="stat-unit">pts</span></div>
          <div className="stat-meta">{sprintMetrics.completedTasks} items completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Sprint Completion</div>
          <div className="stat-value text-amber">{sprintMetrics.progressPercentage}%</div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${sprintMetrics.progressPercentage}%` }}></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Remaining Workload</div>
          <div className="stat-value text-purple">{sprintMetrics.remainingStoryPoints} <span className="stat-unit">pts</span></div>
          <div className="stat-meta">{sprintMetrics.totalTasks - sprintMetrics.completedTasks} tasks pending</div>
        </div>
      </div>

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

          {/* SVG Burndown Visualizer */}
          <div className="burndown-svg-wrap">
            <svg viewBox="0 0 450 180" className="burndown-svg">
              <line x1="40" y1="20" x2="40" y2="150" stroke="#334155" strokeWidth="1" />
              <line x1="40" y1="150" x2="430" y2="150" stroke="#334155" strokeWidth="1" />
              
              {/* Y-axis labels */}
              <text x="32" y="25" fill="#94a3b8" fontSize="10" textAnchor="end">{sprintMetrics.totalStoryPoints}p</text>
              <text x="32" y="85" fill="#94a3b8" fontSize="10" textAnchor="end">{Math.round(sprintMetrics.totalStoryPoints / 2)}p</text>
              <text x="32" y="150" fill="#94a3b8" fontSize="10" textAnchor="end">0</text>

              {/* Ideal Guideline */}
              <line x1="40" y1="25" x2="420" y2="150" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" />

              {/* Actual Burndown Polyline */}
              <polyline 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="3" 
                points="40,25 110,38 180,60 250,90 280,105" 
              />
              
              {/* Actual dots */}
              <circle cx="40" cy="25" r="4" fill="#10b981" />
              <circle cx="110" cy="38" r="4" fill="#10b981" />
              <circle cx="180" cy="60" r="4" fill="#10b981" />
              <circle cx="250" cy="90" r="4" fill="#10b981" />
              <circle cx="280" cy="105" r="5" fill="#ec4899" />
              
              {/* X-axis labels */}
              <text x="40" y="165" fill="#94a3b8" fontSize="10">D0</text>
              <text x="110" y="165" fill="#94a3b8" fontSize="10">D2</text>
              <text x="180" y="165" fill="#94a3b8" fontSize="10">D4</text>
              <text x="250" y="165" fill="#94a3b8" fontSize="10">D6</text>
              <text x="320" y="165" fill="#94a3b8" fontSize="10">D8</text>
              <text x="420" y="165" fill="#94a3b8" fontSize="10">D10 (Goal)</text>
            </svg>
          </div>
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
          <div className="workload-list">
            {workload.map(m => (
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
                  <div className="mini-progress-track">
                    <div 
                      className="mini-progress-fill" 
                      style={{ width: `${m.completionRate}%`, backgroundColor: m.color }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
