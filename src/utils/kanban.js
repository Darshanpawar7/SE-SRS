import { TASK_STATUSES } from './constants';

export function getKanbanColumns(tasks = []) {
  return TASK_STATUSES.map((status) => {
    const columnTasks = tasks.filter((task) => task.status === status.id);
    return {
      ...status,
      tasks: columnTasks,
      count: columnTasks.length
    };
  });
}
