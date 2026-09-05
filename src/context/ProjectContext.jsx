import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataService, getSupabaseConfig } from '../services/supabaseClient';
import { calculateSprintMetrics } from '../utils/estimation';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeSprintId, setActiveSprintId] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, sprintsData, tasksData, actData] = await Promise.all([
        DataService.getProject(),
        DataService.getSprints(),
        DataService.getTasks(),
        DataService.getActivity()
      ]);
      setProject(projData);
      setSprints(sprintsData);
      setTasks(tasksData);
      setActivities(actData);
      
      const activeSprint = sprintsData.find(s => s.status === 'active') || sprintsData[0];
      if (activeSprint) setActiveSprintId(activeSprint.id);
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update a task (e.g. drag & drop status change, edit)
  const updateTask = async (updatedTask, authorName = 'Team Member') => {
    const prevTask = tasks.find(t => t.id === updatedTask.id);
    const newTasks = tasks.map(t => t.id === updatedTask.id ? { ...updatedTask, updated_at: new Date().toISOString() } : t);
    setTasks(newTasks);
    await DataService.saveTasks(newTasks);

    if (prevTask && prevTask.status !== updatedTask.status) {
      const updatedActs = await DataService.logActivity({
        user: authorName,
        action: 'moved task',
        target: updatedTask.title,
        to: updatedTask.status
      });
      setActivities(updatedActs);
    }
  };

  // Create a new task
  const addTask = async (taskData, authorName = 'Team Member') => {
    const newTask = {
      id: 'task-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...taskData
    };
    const newTasks = [newTask, ...tasks];
    setTasks(newTasks);
    await DataService.saveTasks(newTasks);

    const updatedActs = await DataService.logActivity({
      user: authorName,
      action: 'created task',
      target: newTask.title,
      to: newTask.status
    });
    setActivities(updatedActs);
    return newTask;
  };

  // Delete a task
  const deleteTask = async (taskId, authorName = 'Team Member') => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    await DataService.saveTasks(newTasks);

    if (taskToDelete) {
      const updatedActs = await DataService.logActivity({
        user: authorName,
        action: 'deleted task',
        target: taskToDelete.title,
        to: 'removed'
      });
      setActivities(updatedActs);
    }
  };

  // Add or update sprint
  const addSprint = async (sprintData) => {
    const newSprint = {
      id: 'sprint-' + Date.now(),
      total_points: 0,
      completed_points: 0,
      status: 'planned',
      ...sprintData
    };
    const newSprints = [...sprints, newSprint];
    setSprints(newSprints);
    await DataService.saveSprints(newSprints);
    return newSprint;
  };

  const updateSprintStatus = async (sprintId, status) => {
    const newSprints = sprints.map(s => s.id === sprintId ? { ...s, status } : s);
    setSprints(newSprints);
    await DataService.saveSprints(newSprints);
  };

  const refreshConfig = () => {
    setSupabaseConfig(getSupabaseConfig());
    loadData();
  };

  const resetData = () => {
    DataService.resetAllData();
    loadData();
  };

  // Compute metrics for active sprint or all tasks
  const activeSprintTasks = activeSprintId 
    ? tasks.filter(t => t.sprint_id === activeSprintId)
    : tasks;
  const sprintMetrics = calculateSprintMetrics(activeSprintTasks);

  return (
    <ProjectContext.Provider value={{
      project,
      sprints,
      tasks,
      activities,
      activeSprintId,
      setActiveSprintId,
      activeSprintTasks,
      sprintMetrics,
      filterAssignee,
      setFilterAssignee,
      filterPriority,
      setFilterPriority,
      searchQuery,
      setSearchQuery,
      loading,
      updateTask,
      addTask,
      deleteTask,
      addSprint,
      updateSprintStatus,
      supabaseConfig,
      refreshConfig,
      resetData
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
