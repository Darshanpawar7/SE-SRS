import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  DataService,
  getPendingChangeCount,
  getSupabaseConfig,
  getSyncStatus,
  subscribeSyncStatus
} from '../services/supabaseClient';
import { validateStoryPoints } from '../utils/storyPoints';
import { calculateSprintMetrics, selectSprintTasks } from '../utils/estimation';
import { applyTaskUpdate } from '../utils/taskUpdates';
import {
  auditDemoReset,
  auditSprintCreated,
  auditSprintTransition,
  auditTaskCreated,
  auditTaskDeleted,
  auditTaskUpdated
} from '../utils/auditTrail';
import { validateSprint, transitionSprint, resolveSelectedSprint } from '../utils/sprintLifecycle';
import { can, PERMISSIONS } from '../services/authService';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const sprintsRef = useRef([]);
  const [tasks, setTasks] = useState([]);
  const tasksRef = useRef([]);
  const [burndownHistory, setBurndownHistory] = useState({});
  const [activities, setActivities] = useState([]);
  const [activeSprintId, setSelectedSprintId] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  // Cloud sync errors are surfaced to the UI as they happen.
  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  // Changes saved while Supabase was unreachable are sent as soon as the browser is back online.
  useEffect(() => {
    const sendPendingChanges = () => DataService.flushPending();
    window.addEventListener('online', sendPendingChanges);
    return () => window.removeEventListener('online', sendPendingChanges);
  }, []);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const {
        project: projData,
        sprints: sprintsData,
        tasks: tasksData,
        activities: actData
      } = await DataService.loadAll();
      setProject(projData);
      sprintsRef.current = sprintsData;
      setSprints(sprintsData);
      tasksRef.current = tasksData;
      setTasks(tasksData);
      setBurndownHistory(DataService.recordBurndown(sprintsData, tasksData));
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

  // Appends one audit record; the feed always mirrors the stored, append-only history.
  // Show the stored history, which includes every record even when saves finish out of order.
  const refreshActivities = async () => setActivities(await DataService.getActivity());

  const recordAudit = async (record) => {
    if (!record) return;
    await DataService.logActivity(record);
    await refreshActivities();
  };

  // Saves a new task list together with the audit record of the change. If nothing could
  // be stored (for example an invalid estimate), the board returns to the saved list and
  // the error reaches the caller.
  const commitTasks = async (newTasks, auditRecord) => {
    const savedTasks = tasksRef.current;
    tasksRef.current = newTasks;
    setTasks(newTasks);
    try {
      await DataService.saveTasks(newTasks, auditRecord);
    } catch (err) {
      tasksRef.current = savedTasks;
      setTasks(savedTasks);
      throw err;
    }
    setBurndownHistory(DataService.recordBurndown(sprintsRef.current, newTasks));
    await refreshActivities();
  };

  // Update a task (e.g. drag & drop status change, edit)
  const updateTask = async (updatedTask, authorName = 'Team Member') => {
    validateStoryPoints(updatedTask.story_points);
    const { previousTask, tasks: newTasks, durationMs } = applyTaskUpdate(tasksRef.current, updatedTask);
    await commitTasks(newTasks, previousTask ? auditTaskUpdated(previousTask, updatedTask, authorName) : null);
    return { durationMs };
  };

  // Create a new task
  const addTask = async (taskData, authorName = 'Team Member') => {
    validateStoryPoints(taskData.story_points);
    // UUIDs match the tasks.id column, so new tasks can be synced to Supabase.
    const newTask = {
      id: crypto.randomUUID(),
      project_id: project?.id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...taskData
    };
    await commitTasks([newTask, ...tasksRef.current], auditTaskCreated(newTask, authorName));
    return newTask;
  };

  // Delete a task
  const deleteTask = async (taskId, authorName = 'Team Member') => {
    const taskToDelete = tasksRef.current.find(t => t.id === taskId);
    const newTasks = tasksRef.current.filter(t => t.id !== taskId);
    tasksRef.current = newTasks;
    setTasks(newTasks);
    setBurndownHistory(DataService.recordBurndown(sprintsRef.current, newTasks));
    await DataService.deleteTask(taskId, newTasks, taskToDelete ? auditTaskDeleted(taskToDelete, authorName) : null);
    await refreshActivities();
  };

  // Add or update sprint
  const addSprint = async (sprintData, authorName = 'Team Member') => {
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
    setBurndownHistory(DataService.recordBurndown(newSprints, tasksRef.current));
    if (!activeSprintId) setActiveSprintId(newSprint.id);
    await DataService.saveSprints(newSprints, auditSprintCreated(newSprint, authorName));
    await refreshActivities();
    return newSprint;
  };

  const updateSprintStatus = async (sprintId, status, authorName = 'Team Member') => {
    const previousSprint = sprintsRef.current.find(sprint => sprint.id === sprintId);
    const newSprints = transitionSprint(sprintsRef.current, sprintId, status);
    sprintsRef.current = newSprints;
    setSprints(newSprints);
    setBurndownHistory(DataService.recordBurndown(newSprints, tasksRef.current));
    // Starting a sprint selects its board and metrics; completing keeps its report visible.
    if (status === 'active') setActiveSprintId(sprintId);
    await DataService.saveSprints(
      newSprints,
      auditSprintTransition(previousSprint, newSprints.find(sprint => sprint.id === sprintId), authorName)
    );
    await refreshActivities();
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

  // Only the team lead may reset, and only in local demo mode: with Supabase connected the
  // shared cloud data would be loaded again at once, so the reset would change nothing but
  // still be recorded. The board is reset, but the audit trail is kept and records who reset it.
  const resetData = async (member) => {
    if (!can(member, PERMISSIONS.RESET_DEMO_DATA)) {
      throw new Error('Only the team lead can reset the demo data.');
    }
    if (getSupabaseConfig().isConfigured) {
      throw new Error('Disconnect Supabase to reset: the reset only replaces the demo data in this browser.');
    }
    DataService.resetAllData();
    await recordAudit(auditDemoReset(member.name));
    await loadData();
  };

  // Manual retry for changes that are saved locally but not yet in Supabase.
  const retrySync = () => DataService.flushPending();

  // Re-read on every render; sync status changes trigger the re-render.
  const pendingChanges = getPendingChangeCount();

  // Compute metrics for active sprint or all tasks
  const activeSprintTasks = selectSprintTasks(tasks, activeSprintId);
  const sprintMetrics = calculateSprintMetrics(activeSprintTasks);

  return (
    <ProjectContext.Provider value={{
      project,
      sprints,
      tasks,
      activities,
      burndownHistory,
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
      syncStatus,
      pendingChanges,
      retrySync,
      refreshConfig,
      resetData
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);

