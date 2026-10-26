import { TASK_PRIORITIES } from './constants';

export function validateTaskForm({ title, priority }) {
  return typeof title === 'string'
    && title.trim().length > 0
    && TASK_PRIORITIES.some((option) => option.id === priority);
}

export function getTaskFormValues(task, activeSprintId, currentUser) {
  if (task) {
    return {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      storyPoints: task.story_points || 3,
      assigneeId: task.assignee_id || 'u-1',
      sprintId: task.sprint_id || activeSprintId || '',
      labels: task.labels || []
    };
  }

  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    storyPoints: 3,
    assigneeId: currentUser.id,
    sprintId: activeSprintId || '',
    labels: ['feature']
  };
}

export function buildTaskPayload(formValues, currentUser, teamMembers) {
  const assignedMember = teamMembers.find((member) => member.id === formValues.assigneeId);

  return {
    title: formValues.title.trim(),
    description: formValues.description.trim(),
    status: formValues.status,
    priority: formValues.priority,
    story_points: Number(formValues.storyPoints),
    assignee_id: formValues.assigneeId,
    assignee_name: assignedMember ? assignedMember.name : 'Unassigned',
    reporter_name: currentUser.name,
    sprint_id: formValues.sprintId || null,
    labels: formValues.labels
  };
}

export function mergeTaskPayload(task, payload) {
  return { ...task, ...payload };
}
