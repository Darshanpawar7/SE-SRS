import React, { useEffect, useSyncExternalStore } from 'react';
import { flowMetrics } from '../../utils/flowAnalytics';
import { TASK_STATUSES } from '../../utils/constants';
import { flowKey, readFlow, recordFlow, subscribeFlow } from '../../services/flowHistoryStore';
import './flowAnalytics.css';
const fmt = value => value === null ? 'Not recorded' : value < 24 ? `${value.toFixed(1)} h` : `${(value/24).toFixed(1)} d`;
const W=560,H=180;
function Bars({values,label}) {
  const max=Math.max(1,...values.map(v=>v.count));
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>{values.map((v,i)=>{const h=v.count/max*135;return <g key={v.date}><rect className="flow-bar" x={i*W/values.length+2} y={150-h} width={Math.max(1,W/values.length-4)} height={h} rx="3"><title>{v.date}: {v.count} recorded completions</title></rect>{i%7===0&&<text x={i*W/values.length} y="172">{v.date.slice(5)}</text>}</g>;})}</svg>;
}
export default function FlowAnalytics({project,sprint,tasks,activities,onOpenTask,range}) {
  const key=flowKey(project?.id,sprint?.id);
  const observations=useSyncExternalStore(subscribeFlow,()=>readFlow(key),()=>readFlow(null));
  useEffect(()=>{
    const capture=()=>{try { recordFlow(key,tasks); } catch(error) { console.warn('Workflow observation could not be stored:',error); }};
    capture();const timer=setInterval(capture,60000);return ()=>clearInterval(timer);
  },[key,tasks]);
  const metrics=flowMetrics(tasks,activities,range?.end || new Date(),range?.days || 28);
  const recent=range ? observations.filter(r=>r.date>=range.from&&r.date<=range.to) : observations.slice(-28), max=Math.max(1,...recent.map(r=>Object.values(r.counts).reduce((a,b)=>a+b,0)));
  return <section className="flow-section" aria-labelledby="flow-heading">
    <div className="view-header"><div><h3 id="flow-heading" className="card-title">Delivery analytics</h3><p className="card-subtitle">Selected sprint · current work items · {range ? `${range.from} — ${range.to}` : 'last 28 UTC dates'}</p></div><span className="flow-tag">Observed data</span></div>
    <div className="flow-stats">{[['Recorded completions',metrics.completedTransitions],['Median cycle time',fmt(metrics.medianHours)],['85th percentile',fmt(metrics.p85Hours)],['Timed work items',metrics.timedItems]].map(([title,value])=><div key={title}><span>{title}</span><strong>{value}</strong></div>)}</div>
    <div className="flow-grid">
      <article className="chart-card"><h4>Observed cumulative flow</h4><p className="card-subtitle">One stacked observation per date. Missing dates have no sample.</p>
        {recent.length ? <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Recorded workflow distribution by date">{recent.map((r,i)=>{let sum=0;return <g key={r.date}>{TASK_STATUSES.map(s=>{const value=r.counts[s.id]||0, y=150-(sum+value)/max*135;sum+=value;return <rect key={s.id} x={i*W/recent.length+3} y={y} width={Math.max(2,W/recent.length-6)} height={value/max*135} fill={s.color}><title>{r.date}: {s.label}, {value} items</title></rect>})}<text x={i*W/recent.length+3} y="172">{recent.length<8||i%7===0?r.date.slice(5):''}</text></g>})}</svg>:<p>No observations yet. Open a selected sprint to begin recording.</p>}
        <div className="flow-legend">{TASK_STATUSES.map(s=><span key={s.id}><i style={{background:s.color}}/>{s.label}</span>)}</div>
        <details><summary>Observation values</summary><table><thead><tr><th>Date</th>{TASK_STATUSES.map(s=><th key={s.id}>{s.label}</th>)}</tr></thead><tbody>{recent.map(r=><tr key={r.date}><th>{r.date}</th>{TASK_STATUSES.map(s=><td key={s.id}>{r.counts[s.id]||0}</td>)}</tr>)}</tbody></table></details>
      </article>
      <article className="chart-card"><h4>Throughput</h4><p className="card-subtitle">Recorded transitions into Done; reopened items can complete again.</p><Bars values={metrics.throughput} label={`Recorded completions over ${range?.days || 28} UTC dates`}/><details><summary>Daily completion counts</summary><table><thead><tr><th>Date</th><th>Completions</th></tr></thead><tbody>{metrics.throughput.map(r=><tr key={r.date}><th>{r.date}</th><td>{r.count}</td></tr>)}</tbody></table></details></article>
      <article className="chart-card"><h4>Cycle time samples</h4><p className="card-subtitle">From a recorded In Progress transition to its next Done transition.</p>{metrics.cycles.length ? <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cycle time in hours for recorded completion samples">{metrics.cycles.map((c,i)=><circle key={c.id} className="cycle-dot" cx={20+i*(W-40)/Math.max(1,metrics.cycles.length-1)} cy={150-c.hours/Math.max(1,...metrics.cycles.map(v=>v.hours))*125} r="5"><title>{tasks.find(t=>t.id===c.taskId)?.title}: {fmt(c.hours)}</title></circle>)}</svg>:<p className="flow-empty">No complete timing pairs yet. Existing data is not backfilled.</p>}<details><summary>Timing samples</summary><table><thead><tr><th>Work item</th><th>Cycle time</th></tr></thead><tbody>{metrics.cycles.map(c=><tr key={c.id}><th>{tasks.find(t=>t.id===c.taskId)?.title}</th><td>{fmt(c.hours)}</td></tr>)}</tbody></table></details></article>
      <article className="chart-card"><h4>Open work age</h4><p className="card-subtitle">Oldest open items by elapsed time since creation.</p>{metrics.ages.slice(0,6).map(({task,days})=><button key={task.id} className="age-row" onClick={()=>onOpenTask(task)}><span>{task.title}<i style={{width:`${Math.max(2,days/Math.max(1,metrics.ages[0].days)*100)}%`}}/></span><strong>{Math.floor(days)} d</strong></button>)}{!metrics.ages.length&&<p className="flow-empty">No open items with a valid creation date.</p>}</article>
    </div>
    <details className="flow-definitions"><summary>Metric definitions and coverage</summary><p>Flow observations are stored in this browser by project and sprint, starting when this view is opened. They are not shared cloud history. Completions and cycle times use retained audit events for tasks currently in the selected sprint; deleted/moved tasks and missing events are excluded. A zero completion bar means no recorded transition, not proof that no work happened. Median uses the middle observed duration; p85 uses nearest rank. Samples are descriptive, not forecasts. Age uses valid creation timestamps. Unknown values are never estimated.</p></details>
  </section>;
}
