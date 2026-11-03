import { TASK_PRIORITIES } from './constants';
import { sanitizeUserText } from './userText';

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const TASK_LABEL_MAX_LENGTH = 24;

export function sanitizeTaskText(values) {
  return {
    ...values,
    title: sanitizeUserText(values.title, { field: 'Task title', maxLength: TASK_TITLE_MAX_LENGTH, allowNewlines: false }),
    description: sanitizeUserText(values.description, { field: 'Task description', maxLength: TASK_DESCRIPTION_MAX_LENGTH }),
    labels: (Array.isArray(values.labels) ? values.labels : []).map(label =>
      sanitizeUserText(label, { field: 'Tag', maxLength: TASK_LABEL_MAX_LENGTH, allowNewlines: false })
    ).filter(Boolean)
  };
}

export function validateTaskForm({ title, priority }) {
  let safeTitle;
  try {
    safeTitle = sanitizeUserText(title, { field: 'Task title', maxLength: TASK_TITLE_MAX_LENGTH, allowNewlines: false });
  } catch {
    return false;
  }
  return safeTitle.length > 0
    && TASK_PRIORITIES.some((option) => option.id === priority);
}

export function getTaskFormValues(task, activeSprintId, currentUser) {
  if (task) {
    return {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      storyPoints: task.story_points ?? 3,
      assigneeId: task.assignee_id ?? '',
      sprintId: task.sprint_id ?? '',
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
  const safeValues = sanitizeTaskText(formValues);
  const assignedMember = teamMembers.find((member) => member.id === safeValues.assigneeId);

  return {
    title: safeValues.title,
    description: safeValues.description,
    status: safeValues.status,
    priority: safeValues.priority,
    story_points: Number(safeValues.storyPoints),
    assignee_id: safeValues.assigneeId || null,
    assignee_name: assignedMember ? assignedMember.name : 'Unassigned',
    reporter_name: currentUser.name,
    sprint_id: safeValues.sprintId || null,
    labels: safeValues.labels
  };
}

export function mergeTaskPayload(task, payload) {
  return { ...task, ...payload };
}
