// Team 11 Constants & Agile Enums
// Each member signs in with their email (the same accounts as database/schema.sql).
// accessRole decides permissions: only the lead may change project-wide settings.
export const TEAM_MEMBERS = [
  {
    id: 'u-1',
    name: 'Darshan P Pawar',
    usn: 'PES2UG24CS143',
    email: 'darshan@pes.edu',
    accessRole: 'lead',
    role: 'Lead & Full-Stack Architect',
    initials: 'DP',
    color: '#1f6b4c' // Evergreen
  },
  {
    id: 'u-2',
    name: 'Dhatri Shivaprasad',
    usn: 'PES2UG24CS158',
    email: 'dhatri@pes.edu',
    accessRole: 'developer',
    role: 'Frontend & UI/UX Lead',
    initials: 'DS',
    color: '#9c4a2f' // Terracotta
  },
  {
    id: 'u-3',
    name: 'Chandan Kumar K',
    usn: 'PES2UG24CS128',
    email: 'chandan@pes.edu',
    accessRole: 'developer',
    role: 'Backend & Supabase Architect',
    initials: 'CK',
    color: '#3d3d39' // Graphite
  },
  {
    id: 'u-4',
    name: 'Gurubelli Yekambar Eshwar Rao',
    usn: 'PES2UG24CS173',
    email: 'eshwar@pes.edu',
    accessRole: 'developer',
    role: 'Full-Stack & DevOps/Testing Lead',
    initials: 'GE',
    color: '#8a5a12' // Bronze
  }
];

// Stage colours mark the board columns and charts: greys for work not started,
// amber while in progress, teal in review and green when done.
export const TASK_STATUSES = [
  { id: 'backlog', label: 'Backlog', color: '#9c9a93', bg: '#f1f0ec' },
  { id: 'todo', label: 'To Do', color: '#5b5a55', bg: '#efeee9' },
  { id: 'in_progress', label: 'In Progress', color: '#b7791f', bg: '#fbf2e1' },
  { id: 'review', label: 'Code Review', color: '#1a8c86', bg: '#e4f3f1' },
  { id: 'done', label: 'Done', color: '#1f6b4c', bg: '#e7f1ec' }
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#9c9a93', icon: '↓' },
  { id: 'medium', label: 'Medium', color: '#5b5a55', icon: '→' },
  { id: 'high', label: 'High', color: '#b7791f', icon: '↑' },
  { id: 'critical', label: 'Critical', color: '#b0281d', icon: '⚠' }
];

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
