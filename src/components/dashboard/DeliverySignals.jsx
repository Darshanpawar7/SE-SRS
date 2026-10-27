import React from 'react';
import { deliverySignals } from '../../utils/deliverySignals';
import { TEAM_MEMBERS } from '../../utils/constants';
import SignalIcon from '../workspace/SignalIcon';
import { PriorityBadge } from '../workspace/TaskSignals';
import './deliverySignals.css';
export default function DeliverySignals({ tasks, sprint, onOpenTask }) {
  const signal = deliverySignals(tasks,TEAM_MEMBERS.map(m=>m.id),sprint);
  const cards = [
    ['pulse','Work in progress',signal.wip,'In progress + code review'],
    ['review','Review queue',signal.review,'Awaiting code review'],
    ['critical','Critical open',signal.critical,'Excludes completed items'],
    ['person','Needs an owner',signal.unassigned,'No recognised team assignee'],
    ['clock','Stale work',signal.stale,'No update for 7+ days'],
    ['target','Sprint elapsed',signal.clock ? `${signal.clock.percentage}%` : '—',signal.clock ? `${signal.clock.elapsed} / ${signal.clock.duration} calendar days` : 'Select a sprint with valid dates'],
  ];
  return <section className="delivery-section" aria-labelledby="delivery-heading">
    <div className="delivery-heading"><div><span className="eyebrow">DELIVERY TELEMETRY / SELECTED SPRINT</span><h3 id="delivery-heading">Signals worth acting on.</h3></div><span className="delivery-count">{signal.done} COMPLETE / {tasks.length} ITEMS</span></div>
    <div className="signal-metrics">{cards.map(([icon,label,value,note])=><article className="signal-metric" key={label}><div className="signal-metric-label"><SignalIcon name={icon}/><span>{label}</span></div><strong>{value}</strong><small>{note}</small></article>)}</div>
    {signal.clock?.overdue && signal.open>0 && <p className="schedule-note" role="status"><SignalIcon name="clock" size={16}/>The scheduled end date has passed with {signal.open} unfinished items. This is a schedule flag, not a delivery forecast.</p>}
    <div className="signal-panels">
      <article className="card priority-breakdown"><div className="card-header"><div><h3 className="card-title">Priority mix</h3><p className="card-subtitle">Completed / total work items per priority</p></div><SignalIcon name="layers"/></div>
        {signal.priorities.map(p=><div className="priority-breakdown-row" key={p.id}><PriorityBadge priority={p.id}/><div className="priority-meter" role="progressbar" aria-label={`${p.label} items completed`} aria-valuemin={0} aria-valuemax={Math.max(1,p.total)} aria-valuenow={p.done}><span style={{width:`${p.total?p.done/p.total*100:0}%`,background:p.color}}/></div><strong>{p.done} / {p.total}</strong></div>)}
      </article>
      <article className="card attention-panel"><div className="card-header"><div><h3 className="card-title">Attention queue</h3><p className="card-subtitle">Critical, unassigned or stale unfinished items</p></div><span className="attention-count">{signal.attention.length}</span></div>
        {signal.attention.length ? signal.attention.slice(0,5).map(({task,reasons})=><button className="attention-item" key={task.id} onClick={()=>onOpenTask(task)}><span><strong>{task.title}</strong><small>{reasons.join(' · ')}</small></span><SignalIcon name="medium" size={16}/></button>) : <p className="signal-empty">No items match these attention rules.</p>}
        {signal.attention.length>5&&<p className="card-subtitle">Showing 5 of {signal.attention.length}. Use Work items to inspect the full scope.</p>}
        {signal.unknownAge>0&&<p className="card-subtitle">{signal.unknownAge} open items have unknown or future update dates and are excluded from stale counts.</p>}
      </article>
    </div>
    <details className="metric-definitions"><summary>How these metrics are calculated</summary><p>All counts use the selected sprint. WIP includes In Progress and Code Review. Critical and unassigned counts exclude Done. Stale means at least seven elapsed 24-hour periods since the last saved update, falling back to creation time. Calendar elapsed uses UTC dates and includes the start day. Priority mix counts items, not points. Attention flags are rules, not inferred blockers. No forecast, cycle time or velocity estimate is inferred from missing history.</p></details>
  </section>;
}
