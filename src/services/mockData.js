// Pre-populated initial dataset for Team 11
export const INITIAL_PROJECT = {
  id: 'proj-team-11',
  name: 'SprintFlow - Project Management System',
  key: 'PMS',
  description: 'Enterprise project tracking suite with automated workflows, Fibonacci estimation, interactive Kanban boards, and burndown visibility.',
  owner_id: 'u-1',
  owner_name: 'Darshan P Pawar',
  status: 'active',
  created_at: new Date().toISOString()
};

export const INITIAL_SPRINTS = [
  {
    id: 'sprint-1',
    project_id: 'proj-team-11',
    name: 'Sprint 1: Architecture & Core Workflow',
    goal: 'Deliver working authentication, Supabase cloud sync, drag-and-drop Kanban, and story estimation.',
    status: 'active',
    start_date: '2026-09-01',
    end_date: '2026-09-15',
    total_points: 34,
    completed_points: 13
  },
  {
    id: 'sprint-2',
    project_id: 'proj-team-11',
    name: 'Sprint 2: Analytics & Release Candidate',
    goal: 'Build team velocity metrics, exportable reports, and full CI/CD deployment.',
    status: 'planned',
    start_date: '2026-09-16',
    end_date: '2026-09-30',
    total_points: 21,
    completed_points: 0
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-101',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Design Supabase PostgreSQL Database Schema',
    description: 'Create relational tables for projects, sprints, tasks, and audit logs with RLS policies and foreign keys.',
    status: 'done',
    priority: 'critical',
    story_points: 5,
    assignee_id: 'u-3',
    assignee_name: 'Chandan Kumar K',
    reporter_name: 'Darshan P Pawar',
    labels: ['backend', 'database', 'supabase'],
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-03T16:30:00Z'
  },
  {
    id: 'task-102',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Implement Interactive Kanban Board with Drag & Drop',
    description: 'Develop responsive Kanban view with status columns: Backlog, To Do, In Progress, Review, and Done.',
    status: 'done',
    priority: 'critical',
    story_points: 8,
    assignee_id: 'u-2',
    assignee_name: 'Dhatri Shivaprasad',
    reporter_name: 'Darshan P Pawar',
    labels: ['frontend', 'ui', 'kanban'],
    created_at: '2026-09-01T11:00:00Z',
    updated_at: '2026-09-04T14:15:00Z'
  },
  {
    id: 'task-103',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Build Agile Story Point Estimation Engine',
    description: 'Implement Fibonacci scale selection (1, 2, 3, 5, 8, 13) and live sprint capacity calculations.',
    status: 'in_progress',
    priority: 'high',
    story_points: 5,
    assignee_id: 'u-4',
    assignee_name: 'Gurubelli Yekambar Eshwar Rao',
    reporter_name: 'Darshan P Pawar',
    labels: ['estimation', 'sprints', 'analytics'],
    created_at: '2026-09-02T09:00:00Z',
    updated_at: '2026-09-05T08:00:00Z'
  },
  {
    id: 'task-104',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Setup GitHub Actions CI/CD Pipeline',
    description: 'Configure automated linting, Vitest unit test runner, and build gate as per Actions Guide.pdf.',
    status: 'in_progress',
    priority: 'high',
    story_points: 5,
    assignee_id: 'u-4',
    assignee_name: 'Gurubelli Yekambar Eshwar Rao',
    reporter_name: 'Darshan P Pawar',
    labels: ['devops', 'ci-cd', 'github-actions'],
    created_at: '2026-09-02T14:00:00Z',
    updated_at: '2026-09-05T09:30:00Z'
  },
  {
    id: 'task-105',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Create Executive Visibility Dashboard',
    description: 'Develop real-time KPI metrics, burndown visualizer, task completion ratios, and workload cards.',
    status: 'review',
    priority: 'high',
    story_points: 5,
    assignee_id: 'u-1',
    assignee_name: 'Darshan P Pawar',
    reporter_name: 'Darshan P Pawar',
    labels: ['frontend', 'dashboard', 'visibility'],
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-05T11:00:00Z'
  },
  {
    id: 'task-106',
    project_id: 'proj-team-11',
    sprint_id: 'sprint-1',
    title: 'Draft Formal IEEE 830 SRS Document',
    description: 'Produce complete SRS document with 15+ FRs, 5 NFRs, 2 UML diagrams, and Requirements Traceability Matrix.',
    status: 'todo',
    priority: 'critical',
    story_points: 6,
    assignee_id: 'u-1',
    assignee_name: 'Darshan P Pawar',
    reporter_name: 'Darshan P Pawar',
    labels: ['documentation', 'srs', 'pes-submission'],
    created_at: '2026-09-04T09:00:00Z',
    updated_at: '2026-09-04T09:00:00Z'
  },
  {
    id: 'task-107',
    project_id: 'proj-team-11',
    sprint_id: null,
    title: 'Implement Dark/Light Mode Theme Customization',
    description: 'Add persistent theme toggle supporting glassmorphic dark styling and high-contrast accessibility.',
    status: 'backlog',
    priority: 'low',
    story_points: 3,
    assignee_id: 'u-2',
    assignee_name: 'Dhatri Shivaprasad',
    reporter_name: 'Darshan P Pawar',
    labels: ['frontend', 'ui', 'theme'],
    created_at: '2026-09-04T15:00:00Z',
    updated_at: '2026-09-04T15:00:00Z'
  }
];

export const INITIAL_ACTIVITY = [
  {
    id: 'act-1',
    time: '10 mins ago',
    user: 'Darshan P Pawar',
    action: 'moved task',
    target: 'Create Executive Visibility Dashboard',
    to: 'Code Review'
  },
  {
    id: 'act-2',
    time: '45 mins ago',
    user: 'Gurubelli Yekambar Eshwar Rao',
    action: 'updated estimation on',
    target: 'Build Agile Story Point Estimation Engine',
    to: '5 Story Points'
  },
  {
    id: 'act-3',
    time: '2 hours ago',
    user: 'Chandan Kumar K',
    action: 'completed task',
    target: 'Design Supabase Database Schema',
    to: 'Done'
  },
  {
    id: 'act-4',
    time: 'Yesterday',
    user: 'Dhatri Shivaprasad',
    action: 'completed task',
    target: 'Implement Interactive Kanban Board',
    to: 'Done'
  }
];
