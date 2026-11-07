export const PROJECT_ROLE_LABELS = Object.freeze({
  owner: 'Lead', lead: 'Lead', scrum_master: 'Scrum Master',
  developer: 'Developer', contributor: 'Developer', viewer: 'Viewer'
});

export function projectRoleForUser(members, user) {
  const email = String(user?.email ?? '').trim().toLowerCase();
  const match = (members ?? []).find(member =>
    (user?.authUserId && member.auth_user_id === user.authUserId)
    || (email && String(member.email ?? '').trim().toLowerCase() === email)
    || (user?.profileUserId && member.user_id === user.profileUserId));
  return match?.role ?? null;
}

export function buildProjectDashboard(project, members = [], sprints = [], tasks = [], now = new Date()) {
  const statusIds = ['backlog', 'todo', 'in_progress', 'review', 'done'];
  const statusCounts = Object.fromEntries(statusIds.map(status => [status, tasks.filter(task => task.status === status).length]));
  const points = tasks.reduce((sum, task) => sum + (Number(task.story_points) || 0), 0);
  const completedPoints = tasks.filter(task => task.status === 'done').reduce((sum, task) => sum + (Number(task.story_points) || 0), 0);
  const start = project?.start_date ? new Date(`${project.start_date}T00:00:00Z`) : null;
  const end = project?.target_date ? new Date(`${project.target_date}T00:00:00Z`) : null;
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const totalDays = start && end ? Math.max(0, (end - start) / 86400000) : 0;
  const elapsedDays = start ? Math.max(0, (today - start) / 86400000) : 0;
  const daysRemaining = end ? Math.ceil((end - today) / 86400000) : null;
  const lead = members.find(member => ['owner', 'lead'].includes(member.role)) ?? null;
  return {
    name: project?.name ?? '', key: project?.key ?? '', description: project?.description ?? '',
    startDate: project?.start_date ?? null, endDate: project?.target_date ?? null,
    daysRemaining, progress: totalDays ? Math.min(100, Math.round(elapsedDays / totalDays * 100)) : 0,
    lead, members, memberCount: members.length, sprintCount: sprints.length,
    statusCounts, storyPoints: points, completedPoints, remainingPoints: points - completedPoints,
    hasTasks: tasks.length > 0, hasSprints: sprints.length > 0
  };
}

export const toAssigneeOptions = members => (members ?? []).map(member => ({
  id: member.user_id,
  name: member.member_name,
  email: member.email,
  role: PROJECT_ROLE_LABELS[member.role] ?? member.role,
  initials: String(member.member_name ?? '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
  color: member.color ?? '#1f6b4c',
  usn: member.usn ?? ''
}));
