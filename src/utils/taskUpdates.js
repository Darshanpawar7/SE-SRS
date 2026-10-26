export function applyTaskUpdate(tasks, updatedTask, now = () => performance.now()) {
  const startedAt = now();
  const previousTask = tasks.find((task) => task.id === updatedTask.id);
  const updatedTasks = tasks.map((task) => (
    task.id === updatedTask.id
      ? { ...updatedTask, updated_at: new Date().toISOString() }
      : task
  ));

  return {
    previousTask,
    tasks: updatedTasks,
    durationMs: now() - startedAt
  };
}

export function getTaskAfterStatusDrop(tasks, taskId, targetStatus) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task || task.status === targetStatus) return null;
  return { ...task, status: targetStatus };
}

export function createStatusChangeActivity(previousTask, updatedTask, actor, timestamp = new Date().toISOString()) {
  return {
    user: actor,
    actor,
    action: 'moved task',
    target: updatedTask.title,
    task_id: updatedTask.id,
    from: previousTask.status,
    to: updatedTask.status,
    timestamp
  };
}
