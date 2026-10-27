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
    color: '#56364e' // Indigo
  },
  {
    id: 'u-2',
    name: 'Dhatri Shivaprasad',
    usn: 'PES2UG24CS158',
    email: 'dhatri@pes.edu',
    accessRole: 'developer',
    role: 'Frontend & UI/UX Lead',
    initials: 'DS',
    color: '#875365' // Pink
  },
  {
    id: 'u-3',
    name: 'Chandan Kumar K',
    usn: 'PES2UG24CS128',
    email: 'chandan@pes.edu',
    accessRole: 'developer',
    role: 'Backend & Supabase Architect',
    initials: 'CK',
    color: '#22634d' // Emerald
  },
  {
    id: 'u-4',
    name: 'Gurubelli Yekambar Eshwar Rao',
    usn: 'PES2UG24CS173',
    email: 'eshwar@pes.edu',
    accessRole: 'developer',
    role: 'Full-Stack & DevOps/Testing Lead',
    initials: 'GE',
    color: '#86601e' // Amber
  }
];

export const TASK_STATUSES = [
  { id: 'backlog', label: 'Backlog', color: '#626774', bg: '#1e293b' },
  { id: 'todo', label: 'To Do', color: '#86601e', bg: '#451a03' },
  { id: 'in_progress', label: 'In Progress', color: '#3d5970', bg: '#172554' },
  { id: 'review', label: 'Code Review', color: '#634d77', bg: '#3b0764' },
  { id: 'done', label: 'Done', color: '#22634d', bg: '#064e3b' }
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#626774', icon: '↓' },
  { id: 'medium', label: 'Medium', color: '#3d5970', icon: '→' },
  { id: 'high', label: 'High', color: '#86601e', icon: '↑' },
  { id: 'critical', label: 'Critical', color: '#a13838', icon: '⚠' }
];

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
