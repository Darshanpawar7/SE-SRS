import React from 'react';
import SignalIcon from './SignalIcon';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../utils/constants';
export function PriorityBadge({ priority }) {
  const item = TASK_PRIORITIES.find(p => p.id === priority);
  return <span className="signal-badge priority-signal" data-priority={item?.id || 'unknown'}><SignalIcon name={item?.id || 'layers'} size={14} /><span>{item?.label || 'Unknown priority'}</span></span>;
}
export function StatusBadge({ status }) {
  const item = TASK_STATUSES.find(s => s.id === status);
  return <span className="signal-badge status-signal" data-status={item?.id || 'unknown'}><SignalIcon name={item?.id || 'layers'} size={13} /><span>{item?.label || 'Unknown status'}</span></span>;
}
