import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles load before the components, so each component's own stylesheet can refine them.
// Inter is bundled with the app, so the typeface also works offline.
import '@fontsource-variable/inter';
import './index.css';
import './styles/recovery.css';
import App from './App';
import ErrorBoundary from './components/workspace/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <AuthProvider>
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
