import React, { useState } from 'react';
import CommandMenu from './components/workspace/CommandMenu';
import './styles/motion.css';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import KanbanBoard from './components/kanban/KanbanBoard';
import SprintManager from './components/sprint/SprintManager';
import DocsView from './components/docs/DocsView';
import TaskModal from './components/kanban/TaskModal';
import SettingsModal from './components/settings/SettingsModal';
import ProjectSettingsModal from './components/settings/ProjectSettingsModal';
import SignInView from './components/auth/SignInView';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('kanban');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Unauthenticated visitors only ever see the sign-in view.
  if (!currentUser) return <SignInView />;

  const handleOpenNewTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="app-container">
      <a className="skip-link" href="#workspace-main">Skip to workspace</a>
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewTask={handleOpenNewTask}
        onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
      />

      <div className="app-body">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main id="workspace-main" className="app-content" tabIndex={-1}>
          <CommandMenu onNavigate={setActiveTab} onNewTask={handleOpenNewTask} onOpenTask={handleOpenEditTask} onSettings={() => setIsSettingsOpen(true)} />
          {activeTab === 'dashboard' && (
            <DashboardView onNavigateKanban={() => setActiveTab('kanban')} />
          )}

          {activeTab === 'kanban' && (
            <KanbanBoard onOpenTaskModal={handleOpenEditTask} />
          )}

          {activeTab === 'sprints' && (
            <SprintManager />
          )}

          {activeTab === 'docs' && (
            <DocsView />
          )}
        </main>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen}
        task={selectedTask}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {isProjectSettingsOpen && (
        <ProjectSettingsModal onClose={() => setIsProjectSettingsOpen(false)} />
      )}
    </div>
  );
}
