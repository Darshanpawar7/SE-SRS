import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { RecoveryScreen } from '../components/workspace/ErrorBoundary';
describe('Workspace recovery screen',()=>{
  it('offers non-destructive retry and reload without exposing exception details',()=>{
    const html=renderToStaticMarkup(React.createElement(RecoveryScreen,{onRetry:()=>{}}));
    expect(html).toContain('Retry workspace');expect(html).toContain('Reload page');
    expect(html).toContain('Neither action clears saved browser data');expect(html).toContain('role="alert"');
    expect(html).not.toContain('localStorage.clear');
  });
});
