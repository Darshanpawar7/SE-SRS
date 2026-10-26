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
      tone: 'text-indigo',
      meta: `${metrics.totalTasks} tasks in active scope`
    },
    {
      id: 'velocity',
      label: 'Delivered Velocity',
      value: metrics.completedStoryPoints,
      unit: 'pts',
      tone: 'text-emerald',
      meta: `${metrics.completedTasks} items completed`
    },
    {
      id: 'completion',
      label: 'Sprint Completion',
      value: metrics.progressPercentage,
      unit: '%',
      tone: 'text-amber',
      progress: metrics.progressPercentage
    },
    {
      id: 'remaining',
      label: 'Remaining Workload',
      value: metrics.remainingStoryPoints,
      unit: 'pts',
      tone: 'text-purple',
      meta: `${pendingTasks} tasks pending`
    }
  ];
}
