export function findCommands(query, tasks, actions) {
  const needle = query.trim().toLocaleLowerCase();
  const commands = actions.filter(action => !needle || action.label.toLocaleLowerCase().includes(needle));
  if (needle) {
    commands.push(...tasks.filter(task => `${task.title} ${task.id} ${task.description || ''}`.toLocaleLowerCase().includes(needle))
      .slice(0, 8).map(task => ({ id: task.id, label: task.title, hint: 'Open work item', task })));
  }
  return commands;
}
