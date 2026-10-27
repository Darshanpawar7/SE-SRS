import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/workspace/ErrorBoundary';
import './styles/recovery.css';
import './index.css';
import './styles/royal.css';
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
