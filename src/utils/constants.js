// Team 11 Constants & Agile Enums
export const TEAM_MEMBERS = [
  {
    id: 'u-1',
    name: 'Darshan P Pawar',
    usn: 'PES2UG24CS143',
    role: 'Lead & Full-Stack Architect',
    initials: 'DP',
    color: '#6366f1' // Indigo
  },
  {
    id: 'u-2',
    name: 'Dhatri Shivaprasad',
    usn: 'PES2UG24CS158',
    role: 'Frontend & UI/UX Lead',
    initials: 'DS',
    color: '#ec4899' // Pink
  },
  {
    id: 'u-3',
    name: 'Chandan Kumar K',
    usn: 'PES2UG24CS128',
    role: 'Backend & Supabase Architect',
    initials: 'CK',
    color: '#10b981' // Emerald
  },
  {
    id: 'u-4',
    name: 'Gurubelli Yekambar Eshwar Rao',
    usn: 'PES2UG24CS173',
    role: 'Full-Stack & DevOps/Testing Lead',
    initials: 'GE',
    color: '#f59e0b' // Amber
  }
];

export const TASK_STATUSES = [
  { id: 'backlog', label: 'Backlog', color: '#64748b', bg: '#1e293b' },
  { id: 'todo', label: 'To Do', color: '#f59e0b', bg: '#451a03' },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6', bg: '#172554' },
  { id: 'review', label: 'Code Review', color: '#a855f7', bg: '#3b0764' },
  { id: 'done', label: 'Done', color: '#10b981', bg: '#064e3b' }
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#64748b', icon: '↓' },
  { id: 'medium', label: 'Medium', color: '#3b82f6', icon: '→' },
  { id: 'high', label: 'High', color: '#f59e0b', icon: '↑' },
  { id: 'critical', label: 'Critical', color: '#ef4444', icon: '⚠' }
];

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
