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

export function generateBurndownData(totalPoints, completedPoints, daysInSprint = 10) {
  const idealStep = totalPoints / daysInSprint;
  const data = [];
  
  for (let day = 0; day <= daysInSprint; day++) {
    const idealRemaining = Math.max(0, Math.round((totalPoints - (idealStep * day)) * 10) / 10);
    
    // Simulated realistic actual progression curve
    let actualRemaining = totalPoints;
    if (day <= 4) {
      actualRemaining = Math.max(
        totalPoints - completedPoints,
        Math.round((totalPoints - (idealStep * day * 0.75)) * 10) / 10
      );
    } else {
      actualRemaining = Math.max(0, totalPoints - completedPoints);
    }
    
    data.push({
      day: `Day ${day}`,
      ideal: idealRemaining,
      actual: day <= 4 ? actualRemaining : null
    });
  }
  return data;
}
