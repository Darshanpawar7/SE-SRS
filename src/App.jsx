import React, { useEffect, useRef, useState } from 'react';
import WorkspaceFeedback from './components/workspace/WorkspaceFeedback';
import CommandMenu from './components/workspace/CommandMenu';
import TaskExplorer from './components/workspace/TaskExplorer';
import ProjectMap from './components/workspace/ProjectMap';
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
import YourProjectsView from './components/auth/YourProjectsView';
import MembersView from './components/members/MembersView';
import { useAuth } from './context/AuthContext';
import { useProject } from './context/ProjectContext';

export default function App() {
  const { currentUser, authReady, sessionKind, passwordRecovery } = useAuth();
  const { project, loading } = useProject();
  const [activeTab, setActiveTab] = useState('kanban');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const mainRef = useRef(null);

  // Each page opens at the top, not at the scroll position of the page before it.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [activeTab]);

  const navigate = tab => setActiveTab(tab);

  // Unauthenticated visitors only ever see the sign-in view.
  if (!authReady) return <main className="auth-loading" role="status">Restoring your session…</main>;
  if (!currentUser || passwordRecovery) return <SignInView />;
  if (loading) return <main className="auth-loading" role="status">Loading your workspace…</main>;
  if (sessionKind === 'supabase' && !project) return <YourProjectsView />;

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

        <main id="workspace-main" ref={mainRef} className="app-content" tabIndex={-1}>
          <CommandMenu onNavigate={navigate} explorerEnabled onNewTask={handleOpenNewTask} onOpenTask={handleOpenEditTask} onSettings={() => setIsSettingsOpen(true)} />
          <WorkspaceFeedback onNewTask={handleOpenNewTask} />
          {activeTab === 'dashboard' && (
            <DashboardView onNavigateKanban={() => setActiveTab('kanban')} onNavigateSprints={() => setActiveTab('sprints')} onOpenNewTask={handleOpenNewTask} onOpenTask={handleOpenEditTask} />
          )}

          {activeTab === 'kanban' && (
        <KanbanBoard onOpenTaskModal={handleOpenEditTask} onNavigateSprints={() => setActiveTab('sprints')} />
          )}

          {activeTab === 'sprints' && (
            <SprintManager />
          )}

          {activeTab === 'explorer' && <TaskExplorer onOpenTask={handleOpenEditTask} />}
      {activeTab === 'members' && <MembersView />}

          {activeTab === 'map' && <ProjectMap onOpenTask={handleOpenEditTask} onOpenProject={() => setIsProjectSettingsOpen(true)} onNavigateBoard={() => setActiveTab('kanban')} />}

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
