# Local Kanban Performance Check

Run the repeatable state update and React component render benchmark with:

```sh
npm test -- src/tests/kanbanPerformance.test.jsx
```

The test uses Vitest 2.1.9 and Node.js 24.18.0 on the local Windows workspace. It creates 100 synthetic task cards, performs 5 warmup iterations, then measures 30 drag/drop transitions. Each timed iteration includes target-stage selection, the local task state update, and `KanbanBoard` rendering to static HTML with React's `renderToStaticMarkup`. The test prints p50, p95, and maximum timings and fails if the measured combined p95 is 50 ms or more.

Measured run on 2026-11-02:

| Measurement | p50 | p95 | Maximum |
| --- | ---: | ---: | ---: |
| State update | 0.0176 ms | 0.0360 ms | — |
| React component render to static HTML | 4.6057 ms | 6.8379 ms | — |
| Combined transition and render | 4.6229 ms | 6.8576 ms | 7.7533 ms |

The recorded table comes from an isolated benchmark run. During the full-suite run concurrent with lint, combined p95 was 26.6921 ms; it also remained below 50 ms in that run. The benchmark measures React component execution and HTML generation, not a browser DOM commit, layout, paint, real pointer drag event, network persistence, or screen-reader work. These results must not be treated as a measured browser end-to-end latency.
