export function filterTasks(tasks, { filterAssignee = 'all', filterPriority = 'all', searchQuery = '' }) {
  const query = searchQuery.trim().toLowerCase();

  return tasks.filter(task => {
    if (filterAssignee !== 'all' && task.assignee_id !== filterAssignee) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (!query) return true;

    return [task.title, task.description, task.assignee_name]
      .some(value => (value || '').toLowerCase().includes(query));
  });
}

export function resetTaskFilters({ setFilterAssignee, setFilterPriority, setSearchQuery }) {
  setFilterAssignee('all');
  setFilterPriority('all');
  setSearchQuery('');
}
