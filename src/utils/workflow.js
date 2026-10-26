import { TASK_STATUSES } from './constants';

export function getNextTaskStatus(currentStatus) {
  const currentIndex = TASK_STATUSES.findIndex((status) => status.id === currentStatus);
  if (currentIndex < 0 || currentIndex >= TASK_STATUSES.length - 1) return null;
  return TASK_STATUSES[currentIndex + 1].id;
}

export function advanceTaskByOneStage(task, updateTask, authorName) {
  const nextStatus = getNextTaskStatus(task.status);
  if (!nextStatus) return false;

  updateTask({ ...task, status: nextStatus }, authorName);
  return true;
}
