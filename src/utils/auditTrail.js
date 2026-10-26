import { createStatusChangeActivity } from './taskUpdates';

// Append-only audit trail (PMS-F-014): every task and sprint mutation produces one
// attributable, timestamped record. Records are frozen and never edited or removed.
export const AUDIT_TYPES = Object.freeze({ CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' });

const TRACKED_TASK_FIELDS = ['title', 'description', 'status', 'priority', 'story_points', 'assignee_name', 'sprint_id', 'labels'];

export function createAuditRecord({
  actor,
  type,
  action,
  entityType,
  entityId = null,
  target,
  from = null,
  to = null,
  details = null,
  timestamp = new Date().toISOString()
}) {
  if (typeof actor !== 'string' || !actor.trim()) {
    throw new Error('An audit record needs the acting team member.');
  }
  if (!Object.values(AUDIT_TYPES).includes(type)) {
    throw new Error(`Unknown audit record type: ${type}`);
  }
  if (Number.isNaN(Date.parse(timestamp))) {
    throw new Error('An audit record needs a valid timestamp.');
  }

  return Object.freeze({
    id: crypto.randomUUID(),
    type,
    // `user` is the field the dashboard feed and older records already use.
    user: actor.trim(),
    actor: actor.trim(),
    action,
    entity_type: entityType,
    entity_id: entityId,
    target,
    from,
    to,
    details,
    timestamp: new Date(timestamp).toISOString()
  });
}

// Records written by this module carry everything needed to attribute them.
export function isAuditRecord(record) {
  return Boolean(record?.id && record?.actor && record?.type && !Number.isNaN(Date.parse(record?.timestamp)));
}

// Full values are stored so a record shows exactly what changed; the feed shortens
// long text only when displaying it.
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
};

export function describeTaskChanges(before, after) {
  return TRACKED_TASK_FIELDS
    .filter(field => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null))
    .map(field => ({ field, from: before?.[field] ?? null, to: after?.[field] ?? null }));
}

export function auditTaskCreated(task, actor, timestamp) {
  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.CREATE,
    action: 'created task',
    entityType: 'task',
    entityId: task.id,
    target: task.title,
    to: task.status
  });
}

// Returns null when no tracked field changed, so saving an untouched form adds nothing.
export function auditTaskUpdated(before, after, actor, timestamp) {
  const changes = describeTaskChanges(before, after);
  if (changes.length === 0) return null;

  if (changes.length === 1 && changes[0].field === 'status') {
    const move = createStatusChangeActivity(before, after, actor, timestamp);
    return createAuditRecord({
      actor: move.actor,
      timestamp: move.timestamp,
      type: AUDIT_TYPES.UPDATE,
      action: move.action,
      entityType: 'task',
      entityId: move.task_id,
      target: move.target,
      from: move.from,
      to: move.to
    });
  }

  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.UPDATE,
    action: 'updated task',
    entityType: 'task',
    entityId: after.id,
    target: after.title,
    details: changes.map(c => `${c.field}: ${formatValue(c.from)} → ${formatValue(c.to)}`).join('; ')
  });
}

export function auditTaskDeleted(task, actor, timestamp) {
  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.DELETE,
    action: 'deleted task',
    entityType: 'task',
    entityId: task.id,
    target: task.title,
    from: task.status
  });
}

export function auditSprintCreated(sprint, actor, timestamp) {
  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.CREATE,
    action: 'created sprint',
    entityType: 'sprint',
    entityId: sprint.id,
    target: sprint.name,
    to: sprint.status
  });
}

export function auditSprintTransition(before, after, actor, timestamp) {
  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.UPDATE,
    action: after.status === 'active' ? 'started sprint' : 'completed sprint',
    entityType: 'sprint',
    entityId: after.id,
    target: after.name,
    from: before.status,
    to: after.status
  });
}

export function auditDemoReset(actor, timestamp) {
  return createAuditRecord({
    actor, timestamp,
    type: AUDIT_TYPES.UPDATE,
    action: 'reset demo data for',
    entityType: 'project',
    target: 'tasks, sprints and project details'
  });
}

export function formatAuditTime(record, now = new Date()) {
  // Records saved before this change only carry a display string.
  if (!record?.timestamp) return record?.time || '';
  const minutes = Math.floor((new Date(now).getTime() - Date.parse(record.timestamp)) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return new Date(record.timestamp).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
