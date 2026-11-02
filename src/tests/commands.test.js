import { describe, it, expect } from 'vitest';
import { findCommands } from '../utils/commands';
describe('Command center', () => {
  const actions = [{ id: 'kanban', label: 'Go to board' }];
  const tasks = [{ id: 'one', title: 'API work', description: 'Review token handling' }];
  it('shows actions without flooding the default menu with tasks', () => expect(findCommands('', tasks, actions)).toEqual(actions));
  it('searches descriptions and titles case-insensitively', () => expect(findCommands(' TOKEN ', tasks, actions)[0].task).toBe(tasks[0]));
  it('returns navigation and task matches and caps task results', () => {
    expect(findCommands('board', tasks, actions)).toHaveLength(1);
    expect(findCommands('API', Array.from({ length:20 }, (_,i) => ({...tasks[0],id:i})), actions)).toHaveLength(8);
  });
});
