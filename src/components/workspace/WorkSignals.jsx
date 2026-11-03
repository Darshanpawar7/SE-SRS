import React from 'react';
import {workSignals} from '../../utils/workSignals';
import './workSignals.css';
export default function WorkSignals({task}) {
 const signals=workSignals(task);
 return <span className="work-signals">{signals.blocked&&<span className="work-flag blocked" title={task.blocked_reason}>⊘ Blocked</span>}{task.due_date&&<span className={`work-flag ${signals.overdue?'overdue':''}`}>◷ {signals.overdue?'Overdue · ':signals.dueToday?'Due today · ':''}{task.due_date}</span>}</span>;
}
