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

export function generateBurndownData(totalPoints, completedPoints, daysInSprint = 10, elapsedDays = null) {
  const round1 = (n) => Math.round(n * 10) / 10;
  const remaining = Math.max(0, totalPoints - completedPoints);
  const idealStep = daysInSprint > 0 ? totalPoints / daysInSprint : 0;

  // Only a current snapshot is stored, not per-day history, so the actual series
  // is interpolated between the two points we genuinely know: the full backlog at
  // day 0 and the remaining work today. It is plotted up to today and no further,
  // which is why `actual` is null for future days.
  const today = elapsedDays === null
    ? Math.round(daysInSprint * 0.4)
    : Math.max(0, Math.min(daysInSprint, Math.round(elapsedDays)));

  const data = [];
  for (let day = 0; day <= daysInSprint; day++) {
    const ideal = Math.max(0, round1(totalPoints - idealStep * day));

    let actual = null;
    if (day <= today) {
      const progress = today === 0 ? 1 : day / today;
      actual = Math.max(0, round1(totalPoints - (totalPoints - remaining) * progress));
    }

    data.push({ day: `Day ${day}`, ideal, actual });
  }
  return data;
}

