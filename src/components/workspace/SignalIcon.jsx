import React from 'react';
const paths = {
  pulse: 'M2 12h5l3-8 4 16 3-8h5',
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  target: 'M20 12a8 8 0 1 1-8-8M12 8a4 4 0 1 0 4 4M12 12l9-9M16 3h5v5',
  clock: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  person: 'M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',
  critical: 'm6 12 6-6 6 6m-12 6 6-6 6 6',
  high: 'm6 15 6-6 6 6', medium: 'M5 12h14m-5-5 5 5-5 5', low: 'm6 9 6 6 6-6',
  backlog: 'M4 6h16M4 12h16M4 18h10', todo: 'M5 5h14v14H5z',
  in_progress: 'm9 5 10 7-10 7V5', review: 'M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6M12 9v6',
  done: 'm5 12 4 4L19 6', export: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
};
export default function SignalIcon({ name, size = 18 }) {
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.layers} /></svg>;
}
