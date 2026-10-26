// A null selection is an empty sprint, never an implicit project-wide scope.
export function selectSprintTasks(tasks = [], sprintId) {
  return sprintId ? tasks.filter(task => task.sprint_id === sprintId) : [];
}

// Agile Estimation & Velocity Utilities
export function calculateSprintMetrics(tasks = []) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);
  const completedStoryPoints = tasks
    .filter(t => t.status === 'done')
    .reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);
  const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

  const progressPercentage = totalStoryPoints > 0 
    ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
    : 0;

  return {
    totalTasks,
    completedTasks,
    totalStoryPoints,
    completedStoryPoints,
    remainingStoryPoints,
    progressPercentage
  };
}

export function calculateMemberWorkload(tasks = [], members = []) {
  return members.map(member => {
    const memberTasks = tasks.filter(t => t.assignee_id === member.id);
    const assignedPoints = memberTasks.reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);
    const completedPoints = memberTasks
      .filter(t => t.status === 'done')
      .reduce((sum, t) => sum + (Number(t.story_points) || 0), 0);

    return {
      ...member,
      taskCount: memberTasks.length,
      assignedPoints,
      completedPoints,
      completionRate: assignedPoints > 0 ? Math.round((completedPoints / assignedPoints) * 100) : 0
    };
  });
}
