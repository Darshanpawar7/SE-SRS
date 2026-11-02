import { describe, expect, it, vi } from 'vitest';
import { filterTasks, resetTaskFilters } from '../utils/taskFilters';

const tasks = [
  { id: '1', assignee_id: 'u-1', priority: 'high', title: 'Fix login bug', description: 'Callback issue', assignee_name: 'Alex Doe' },
  { id: '2', assignee_id: 'u-1', priority: 'low', title: 'Write login docs', description: '', assignee_name: 'Alex Doe' },
  { id: '3', assignee_id: 'u-2', priority: 'high', title: 'Fix board bug', description: 'Drag issue', assignee_name: 'Sam Roe' }
];

describe('task board filters', () => {
  it('combines assignee, priority, and text query using every selected predicate', () => {
    expect(filterTasks(tasks, {
      filterAssignee: 'u-1',
      filterPriority: 'high',
      searchQuery: 'CALLBACK'
    }).map(task => task.id)).toEqual(['1']);

    expect(filterTasks(tasks, {
      filterAssignee: 'u-1',
      filterPriority: 'high',
      searchQuery: 'board'
    })).toEqual([]);
  });

  it('reset clears assignee, priority, and search state', () => {
    const setFilterAssignee = vi.fn();
    const setFilterPriority = vi.fn();
    const setSearchQuery = vi.fn();

    resetTaskFilters({ setFilterAssignee, setFilterPriority, setSearchQuery });

    expect(setFilterAssignee).toHaveBeenCalledWith('all');
    expect(setFilterPriority).toHaveBeenCalledWith('all');
    expect(setSearchQuery).toHaveBeenCalledWith('');
  });
});
