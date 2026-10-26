import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DataService, getSupabaseConfig } from '../services/supabaseClient';
import { validateStoryPoints } from '../utils/storyPoints';
import { calculateSprintMetrics, selectSprintTasks } from '../utils/estimation';
import { applyTaskUpdate, createStatusChangeActivity } from '../utils/taskUpdates';
import { validateSprint, transitionSprint, resolveSelectedSprint } from '../utils/sprintLifecycle';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const sprintsRef = useRef([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeSprintId, setSelectedSprintId] = useState(null);
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
      sprintsRef.current = sprintsData;
      setSprints(sprintsData);
      setTasks(tasksData);
      setActivities(actData);
      
      setSelectedSprintId(resolveSelectedSprint(sprintsData, DataService.getSelectedSprint()));
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
    validateStoryPoints(updatedTask.story_points);
    const { previousTask, tasks: newTasks, durationMs } = applyTaskUpdate(tasks, updatedTask);
    setTasks(newTasks);
    await DataService.saveTasks(newTasks);

    if (previousTask && previousTask.status !== updatedTask.status) {
      const updatedActs = await DataService.logActivity(
        createStatusChangeActivity(previousTask, updatedTask, authorName)
      );
      setActivities(updatedActs);
    }

    return { durationMs };
  };

  // Create a new task
  const addTask = async (taskData, authorName = 'Team Member') => {
    validateStoryPoints(taskData.story_points);
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
    const validated = validateSprint(sprintData);
    const newSprint = {
      id: crypto.randomUUID(),
      total_points: 0,
      completed_points: 0,
      ...validated,
      project_id: project?.id,
      status: 'planned'
    };
    const newSprints = [...sprintsRef.current, newSprint];
    sprintsRef.current = newSprints;
    setSprints(newSprints);
    if (!activeSprintId) setActiveSprintId(newSprint.id);
    await DataService.saveSprints(newSprints);
    return newSprint;
  };

  const updateSprintStatus = async (sprintId, status) => {
    const newSprints = transitionSprint(sprintsRef.current, sprintId, status);
    sprintsRef.current = newSprints;
    setSprints(newSprints);
    // Starting a sprint selects its board and metrics; completing keeps its report visible.
    if (status === 'active') setActiveSprintId(sprintId);
    await DataService.saveSprints(newSprints);
  };

  const setActiveSprintId = (sprintId) => {
    if (!sprintsRef.current.some(sprint => sprint.id === sprintId)) return;
    DataService.saveSelectedSprint(sprintId);
    setSelectedSprintId(sprintId);
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
  const activeSprintTasks = selectSprintTasks(tasks, activeSprintId);
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

