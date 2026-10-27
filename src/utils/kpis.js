// Executive KPI cards, derived only from the selected sprint's metrics (PMS-F-012).
// Because they are computed from task state on every render, any task mutation
// updates them immediately without a page reload.
export function buildKpiCards(metrics) {
  const pendingTasks = metrics.totalTasks - metrics.completedTasks;

  return [
    {
      id: 'total',
      label: 'Total Story Points',
      value: metrics.totalStoryPoints,
      unit: 'pts',
      tone: 'tone-strong',
      meta: `${metrics.totalTasks} tasks in active scope`
    },
    {
      id: 'velocity',
      label: 'Delivered Velocity',
      value: metrics.completedStoryPoints,
      unit: 'pts',
      tone: 'tone-success',
      meta: `${metrics.completedTasks} items completed`
    },
    {
      id: 'completion',
      label: 'Sprint Completion',
      value: metrics.progressPercentage,
      unit: '%',
      tone: 'tone-strong',
      progress: metrics.progressPercentage
    },
    {
      id: 'remaining',
      label: 'Remaining Workload',
      value: metrics.remainingStoryPoints,
      unit: 'pts',
      tone: 'tone-warning',
      meta: `${pendingTasks} tasks pending`
    }
  ];
}
