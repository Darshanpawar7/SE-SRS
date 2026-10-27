import React from 'react';
export function RecoveryScreen({ onRetry }) {
  return <main className="recovery-page"><section className="recovery-card" role="alert" aria-labelledby="recovery-title">
    <span className="eyebrow">SPRINTFLOW / WORKSPACE RECOVERY</span>
    <h1 id="recovery-title">A pause. Not a reset.</h1>
    <p>The workspace could not display this view. Retry the interface, or reload the page. Neither action clears saved browser data.</p>
    <div className="recovery-actions"><button className="btn btn-primary" onClick={onRetry}>Retry workspace</button><button className="btn btn-secondary" onClick={() => window.location.reload()}>Reload page</button></div>
    <p className="card-subtitle">If this continues, share the browser console error with the team. Unsaved form edits may need to be entered again.</p>
  </section></main>;
}
export default class ErrorBoundary extends React.Component {
  state = { failed:false };
  static getDerivedStateFromError() { return { failed:true }; }
  componentDidCatch(error, info) { console.error('Workspace render failed:', error, info.componentStack); }
  render() {
    return this.state.failed ? <RecoveryScreen onRetry={() => this.setState({ failed:false })} /> : this.props.children;
  }
}
