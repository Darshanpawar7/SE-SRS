import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import { validateProjectMetadata } from '../utils/projectMetadata';
import {
  auditDemoReset,
  auditProjectUpdated,
  auditSprintCreated,
  auditSprintDeleted,
  auditSprintTransition,
  auditTaskCreated,
  auditTaskDeleted,
  auditTaskUpdated
} from '../utils/auditTrail';
import { validateSprint, transitionSprint, resolveSelectedSprint } from '../utils/sprintLifecycle';
import { can, PERMISSIONS } from '../services/authService';

import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { cloudVerified, currentUser } = useAuth();
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
  // Filters live above the keyed workspace, so clear them when a different member signs in.
  const [filterOwnerId, setFilterOwnerId] = useState(currentUser?.id ?? null);
  if (filterOwnerId !== (currentUser?.id ?? null)) {
    setFilterOwnerId(currentUser?.id ?? null);
    setFilterAssignee('all');
    setFilterPriority('all');
    setSearchQuery('');
  }
  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());

  // Cloud sync errors are surfaced to the UI as they happen.
  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  // Queued changes may only be sent by the account that owns them: in cloud mode that
  // means after Supabase has verified the signed-in member.
  const canSync = !supabaseConfig.isConfigured || cloudVerified;

  // Changes saved while Supabase was unreachable are sent as soon as the browser is back online.
  useEffect(() => {
    if (!canSync) return undefined;
    const sendPendingChanges = () => DataService.flushPending();
    window.addEventListener('online', sendPendingChanges);
    return () => window.removeEventListener('online', sendPendingChanges);
  }, [canSync]);

  // The service owns I/O; this callback applies a fully loaded snapshot.
  const applyLoadedData = useCallback(({ project: projData, sprints: sprintsData, tasks: tasksData, activities: actData }) => {
    setProject(projData);
    sprintsRef.current = sprintsData;
    setSprints(sprintsData);
    tasksRef.current = tasksData;
    setTasks(tasksData);
    setBurndownHistory(DataService.recordBurndown(sprintsData, tasksData));
    setActivities(actData);
    setSelectedSprintId(resolveSelectedSprint(sprintsData, DataService.getSelectedSprint()));
  }, []);

  const loadData = async () => {
    try {
      applyLoadedData(await DataService.loadAll());
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let current = true;
    if (supabaseConfig.isConfigured && !cloudVerified) {
      Promise.resolve().then(() => { if (current) { setProject(null); setTasks([]); tasksRef.current = []; setSprints([]); sprintsRef.current = []; setActivities([]); setLoading(false); } });
      return () => { current = false; };
    }
    DataService.loadAll().then(data => {
      if (current) applyLoadedData(data);
    }).catch(err => {
      if (current) console.error('Failed to load project data:', err);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [applyLoadedData, cloudVerified, currentUser?.id, supabaseConfig.isConfigured]);

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

  const deleteSprint = async (sprintId, authorName = 'Team Member') => {
    const sprintToDelete = sprintsRef.current.find(sprint => sprint.id === sprintId);
    if (!sprintToDelete) throw new Error('The sprint could not be found.');

    const newSprints = sprintsRef.current.filter(sprint => sprint.id !== sprintId);
    const auditRecords = [auditSprintDeleted(sprintToDelete, authorName)];
    const newTasks = tasksRef.current.map(task => {
      if (task.sprint_id !== sprintId) return task;
      const detachedTask = { ...task, sprint_id: null };
      const auditRecord = auditTaskUpdated(task, detachedTask, authorName);
      if (auditRecord) auditRecords.push(auditRecord);
      return detachedTask;
    });
    sprintsRef.current = newSprints;
    setSprints(newSprints);
    tasksRef.current = newTasks;
    setTasks(newTasks);

    const nextSelectedSprintId = resolveSelectedSprint(
      newSprints,
      activeSprintId === sprintId ? null : activeSprintId
    );
    DataService.saveSelectedSprint(nextSelectedSprintId);
    setSelectedSprintId(nextSelectedSprintId);
    setBurndownHistory(DataService.recordBurndown(newSprints, newTasks));

    const synced = await DataService.deleteSprint(
      sprintId,
      newSprints,
      newTasks,
      auditRecords
    );
    await refreshActivities();
    return synced;
  };

  const setActiveSprintId = (sprintId) => {
    if (!sprintsRef.current.some(sprint => sprint.id === sprintId)) return;
    DataService.saveSelectedSprint(sprintId);
    setSelectedSprintId(sprintId);
  };

  // Only the team lead may edit project details. Values are validated (unique key,
  // name, date range), shown in every project view, and saved together with their
  // audit record before anything is sent to Supabase.
  const updateProject = async (values, member) => {
    if (!can(member, PERMISSIONS.EDIT_PROJECT)) {
      throw new Error('Only the team lead can edit project details.');
    }
    if (!project) throw new Error('The project is still loading. Try again in a moment.');
    const otherProjects = (await DataService.listProjects()).filter(item => item.id !== project.id);
    const updated = { ...project, ...validateProjectMetadata(values, otherProjects) };
    const auditRecord = auditProjectUpdated(project, updated, member.name);
    setProject(updated);
    await DataService.saveProject(updated, auditRecord);
    await refreshActivities();
    return updated;
  };

  const refreshConfig = () => {
    setSupabaseConfig(getSupabaseConfig());
    setLoading(true);
    if (!getSupabaseConfig().isConfigured || cloudVerified) loadData();
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
    setLoading(true);
    await loadData();
  };

  // Manual retry for changes that are saved locally but not yet in Supabase.
  const retrySync = () => (canSync ? DataService.flushPending() : Promise.resolve(false));

  // Re-read on every render; sync status changes trigger the re-render.
  const pendingChanges = getPendingChangeCount();

  // Compute metrics for active sprint or all tasks
  const activeSprintTasks = selectSprintTasks(tasks, activeSprintId);
  const sprintMetrics = calculateSprintMetrics(activeSprintTasks);

  return (
    <ProjectContext.Provider value={{
      project,
      updateProject,
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
      deleteSprint,
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
