import React, { useState } from 'react';

export default function DocsView() {
  const [activeTab, setActiveTab] = useState('fr');

  const functionalReqs = [
    { id: 'FR-01', title: 'User Authentication & Role Management', desc: 'System shall support user authentication with profiles for Team Lead, Developers, Scrum Master, and Evaluator roles.', priority: 'High', owner: 'Darshan P Pawar' },
    { id: 'FR-02', title: 'Project Creation & Metadata Tracking', desc: 'System shall allow creating projects with unique keys, descriptions, start/end dates, and member assignments.', priority: 'High', owner: 'Darshan P Pawar' },
    { id: 'FR-03', title: 'Kanban Board Drag-and-Drop Workflow', desc: 'System shall provide an interactive 5-column Kanban board (Backlog, Todo, In Progress, Review, Done) with drag-and-drop state transitions.', priority: 'Critical', owner: 'Dhatri Shivaprasad' },
    { id: 'FR-04', title: 'Task Creation and Rich Attributes', desc: 'System shall allow creating tasks with title, description, priority, assignee, story points, and labels.', priority: 'High', owner: 'Dhatri Shivaprasad' },
    { id: 'FR-05', title: 'Agile Fibonacci Estimation Engine', desc: 'System shall support story point assignment using Fibonacci values (1, 2, 3, 5, 8, 13, 21) with capacity recalculations.', priority: 'Critical', owner: 'Gurubelli Yekambar Eshwar Rao' },
    { id: 'FR-06', title: 'Sprint Lifecycle Management', desc: 'System shall support creating, planning, activating, and completing iterative sprints with target goals.', priority: 'High', owner: 'Gurubelli Yekambar Eshwar Rao' },
    { id: 'FR-07', title: 'Real-Time Burndown Velocity Tracking', desc: 'System shall calculate and visualize burndown curves comparing ideal velocity against actual remaining points.', priority: 'High', owner: 'Gurubelli Yekambar Eshwar Rao' },
    { id: 'FR-08', title: 'Supabase PostgreSQL Cloud Sync', desc: 'System shall provide real-time cloud data persistence with PostgreSQL tables and Row Level Security (RLS).', priority: 'Critical', owner: 'Chandan Kumar K' },
    { id: 'FR-09', title: 'Zero-Config Offline / Demo Fallback', desc: 'System shall automatically operate in offline localStorage mode when cloud credentials are not supplied.', priority: 'High', owner: 'Chandan Kumar K' },
    { id: 'FR-10', title: 'Executive Visibility KPI Dashboard', desc: 'System shall display project progress percentages, total story points, completed velocity, and remaining workload.', priority: 'High', owner: 'Darshan P Pawar' },
    { id: 'FR-11', title: 'Team Workload & Capacity Balancing', desc: 'System shall aggregate assigned points and completion rates per team member to prevent burnout.', priority: 'Medium', owner: 'Darshan P Pawar' },
    { id: 'FR-12', title: 'Audit Trail & Activity Logging', desc: 'System shall log all task state changes, sprint activations, and assignee modifications with timestamps.', priority: 'High', owner: 'Chandan Kumar K' },
    { id: 'FR-13', title: 'Multi-Dimensional Search & Filtering', desc: 'System shall filter Kanban tasks by assignee, priority level, and full-text keyword matching.', priority: 'Medium', owner: 'Dhatri Shivaprasad' },
    { id: 'FR-14', title: 'Task Quick-Advancement Action', desc: 'System shall provide 1-click step buttons to advance tasks sequentially across the Kanban workflow.', priority: 'Medium', owner: 'Dhatri Shivaprasad' },
    { id: 'FR-15', title: 'Automated CI/CD Verification', desc: 'System shall execute GitHub Actions CI pipeline on push/PR for linting, unit testing, and build gates.', priority: 'High', owner: 'Gurubelli Yekambar Eshwar Rao' },
    { id: 'FR-16', title: 'Database Seed & Demo Data Reset', desc: 'System shall provide a 1-click reset button to repopulate initial academic project seed data.', priority: 'Medium', owner: 'Chandan Kumar K' }
  ];

  const nonFunctionalReqs = [
    { id: 'NFR-01', cat: 'Performance', req: 'Board drag-and-drop state updates and UI rerenders shall complete in < 50ms locally.', test: 'Automated Vitest execution' },
    { id: 'NFR-02', cat: 'Availability', req: 'System shall maintain 100% functionality even during network disconnects via offline fallback.', test: 'Manual offline simulation' },
    { id: 'NFR-03', cat: 'Security', req: 'Supabase PostgreSQL tables shall enforce Row Level Security (RLS) policies.', test: 'RLS policy verification' },
    { id: 'NFR-04', cat: 'Usability', req: 'UI shall adhere to modern glassmorphic dark design system with high contrast text.', test: 'Lighthouse accessibility score > 90' },
    { id: 'NFR-05', cat: 'Maintainability', req: 'Codebase shall follow modular architecture with clean separation of services, context, and components.', test: 'ESLint and build pipeline verification' }
  ];

  const rtmData = [
    { reqId: 'FR-01', feature: 'Auth & Roles', testRef: 'TC-AUTH-01', status: 'Passed', branch: 'feature/darshan-core-auth-dashboard' },
    { reqId: 'FR-03', feature: 'Kanban Board', testRef: 'TC-KANBAN-01', status: 'Passed', branch: 'feature/dhatri-kanban-workflow' },
    { reqId: 'FR-05', feature: 'Fibonacci Estimation', testRef: 'TC-EST-01', status: 'Passed', branch: 'feature/eshwar-sprint-estimation-cicd' },
    { reqId: 'FR-07', feature: 'Burndown Chart', testRef: 'TC-EST-02', status: 'Passed', branch: 'feature/eshwar-sprint-estimation-cicd' },
    { reqId: 'FR-08', feature: 'Supabase Cloud Sync', testRef: 'TC-SUPA-01', status: 'Passed', branch: 'feature/chandan-supabase-backend-api' },
    { reqId: 'FR-12', feature: 'Audit Trail', testRef: 'TC-LOG-01', status: 'Passed', branch: 'feature/chandan-supabase-backend-api' },
    { reqId: 'FR-15', feature: 'CI/CD Pipeline', testRef: 'TC-CICD-01', status: 'Passed', branch: 'feature/eshwar-sprint-estimation-cicd' }
  ];

  return (
    <div className="docs-page">
      <div className="view-header">
        <div>
          <h2 className="view-title">Software Requirements Specification (SRS) & RTM</h2>
          <p className="view-subtitle">IEEE 830 compliant academic specification and Requirements Traceability Matrix for Team 11</p>
        </div>
        <div className="docs-tab-btns">
          <button className={`btn btn-sm ${activeTab === 'fr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('fr')}>
            Functional Requirements (16)
          </button>
          <button className={`btn btn-sm ${activeTab === 'nfr' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('nfr')}>
            Non-Functional (5)
          </button>
          <button className={`btn btn-sm ${activeTab === 'rtm' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('rtm')}>
            Traceability Matrix (RTM)
          </button>
        </div>
      </div>

      {activeTab === 'fr' && (
        <div className="card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Feature Title</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Assigned Lead</th>
              </tr>
            </thead>
            <tbody>
              {functionalReqs.map(r => (
                <tr key={r.id}>
                  <td><span className="code-pill">{r.id}</span></td>
                  <td><strong>{r.title}</strong></td>
                  <td className="desc-cell">{r.desc}</td>
                  <td><span className={`priority-badge-sm ${r.priority.toLowerCase()}`}>{r.priority}</span></td>
                  <td>{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'nfr' && (
        <div className="card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Category</th>
                <th>Non-Functional Requirement Specification</th>
                <th>Verification Test</th>
              </tr>
            </thead>
            <tbody>
              {nonFunctionalReqs.map(r => (
                <tr key={r.id}>
                  <td><span className="code-pill">{r.id}</span></td>
                  <td><strong>{r.cat}</strong></td>
                  <td>{r.req}</td>
                  <td><span className="test-badge">{r.test}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rtm' && (
        <div className="card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Feature Module</th>
                <th>Test Case Reference</th>
                <th>Git Feature Branch</th>
                <th>Test Status</th>
              </tr>
            </thead>
            <tbody>
              {rtmData.map(r => (
                <tr key={r.reqId}>
                  <td><span className="code-pill">{r.reqId}</span></td>
                  <td><strong>{r.feature}</strong></td>
                  <td><code>{r.testRef}</code></td>
                  <td><code className="branch-name">{r.branch}</code></td>
                  <td><span className="status-tag passed">✓ {r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
