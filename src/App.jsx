import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './components/dashboard/DashboardView';
import KanbanBoard from './components/kanban/KanbanBoard';
import SprintManager from './components/sprint/SprintManager';
import DocsView from './components/docs/DocsView';
import TaskModal from './components/kanban/TaskModal';
import SettingsModal from './components/settings/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('kanban');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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
      <Navbar 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewTask={handleOpenNewTask}
      />

      <div className="app-body">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="app-content">
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
    </div>
  );
}
