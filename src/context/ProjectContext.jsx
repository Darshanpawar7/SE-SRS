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
import { listUserProjects, createUserProject, listProjectInvitations, listProjectMembers, manageProjectInvitation, resendProjectInvitation, inviteProjectMember, changeProjectMemberRole, removeProjectMember, respondToProjectInvitation, subscribeSelectedProjectRealtime } from '../services/projectService';
import { projectRoleForUser } from '../utils/projectDashboard';
import { getSupabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const { currentUser, authReady, sessionKind } = useAuth();
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
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
  const [projectError, setProjectError] = useState('');
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const projectRole = sessionKind === 'supabase'
    ? projectRoleForUser(members, currentUser)
    : currentUser?.accessRole ?? null;
  const currentMember = sessionKind === 'supabase'
    ? members.find(member => String(member.email ?? '').toLowerCase() === String(currentUser?.email ?? '').toLowerCase()) ?? null
    : members.find(member => member.id === currentUser?.id) ?? null;
  const canProject = permission => {
    if (permission === PERMISSIONS.EDIT_PROJECT || permission === PERMISSIONS.RESET_DEMO_DATA) return ['lead', 'owner'].includes(projectRole);
    return false;
  };

  const refreshProjectMembers = useCallback(async (projectId = project?.id) => {
    if (!projectId || sessionKind !== 'supabase') { setMembers([]); return []; }
    const listed = await listProjectMembers(projectId);
    setMembers(listed);
    return listed;
  }, [project?.id, sessionKind]);

  const refreshInvitations = useCallback(async (projectId = project?.id) => {
    if (sessionKind !== 'supabase') { setInvitations([]); return []; }
    const listed = await listProjectInvitations(projectId ?? null);
    setInvitations(listed);
    return listed;
  }, [project?.id, sessionKind]);

  // Cloud sync errors are surfaced to the UI as they happen.
  useEffect(() => subscribeSyncStatus(setSyncStatus), []);

  // Changes saved while Supabase was unreachable are sent as soon as the browser is back online.
  useEffect(() => {
    const sendPendingChanges = () => DataService.flushPending();
    window.addEventListener('online', sendPendingChanges);
    return () => window.removeEventListener('online', sendPendingChanges);
  }, []);

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

  const loadData = useCallback(async (projectId = null) => {
    setLoading(true);
    try {
      applyLoadedData(await DataService.loadAll(projectId));
    } catch (err) {
      console.error('Failed to load project data:', err);
      setProjectError(err.message || 'Project data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData]);

  const selectProject = async projectId => {
    if (sessionKind === 'supabase') {
      setMembers([]);
      setInvitations([]);
      DataService.setActiveProject(projectId);
      await loadData(projectId);
      await Promise.all([refreshProjectMembers(projectId), refreshInvitations(projectId)]);
      return;
    }
    DataService.setActiveProject(null);
    await loadData();
  };

  const refreshProjects = async () => {
    if (sessionKind === 'supabase') {
      const listed = await listUserProjects();
      setProjects(listed);
      return listed;
    }
    const local = await DataService.getProject();
    const listed = local ? [local] : [];
    setProjects(listed);
    return listed;
  };

  const createProject = async values => {
    setProjectError('');
    const created = await createUserProject(values, projects);
    const listed = await refreshProjects();
    if (!listed.some(item => item.id === created.id)) setProjects([created, ...listed]);
    await selectProject(created.id);
    return created;
  };

  useEffect(() => {
    if (!project?.id || sessionKind !== 'supabase') return undefined;
    const supabase = getSupabase();
    const unsubscribe = subscribeSelectedProjectRealtime(supabase, project.id, table => {
      loadData(project.id).catch(error => setProjectError(error.message));
      if (table === 'project_members') refreshProjectMembers(project.id).catch(error => setProjectError(error.message));
    });
    return unsubscribe;
  }, [project?.id, sessionKind, loadData, refreshProjectMembers]);

  useEffect(() => {
    let current = true;
    if (!authReady) return () => { current = false; };
    const initialize = async () => {
      setProjectError('');
      if (!currentUser) {
        DataService.setActiveProject(null);
        setProject(null);
        setProjects([]);
        setMembers([]);
        setInvitations([]);
        sprintsRef.current = [];
        tasksRef.current = [];
        setSprints([]);
        setTasks([]);
        setBurndownHistory({});
        setActivities([]);
        setSelectedSprintId(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (sessionKind === 'supabase') {
          setMembers([]);
          setInvitations([]);
          const listed = await listUserProjects();
          if (!current) return;
          setProjects(listed);
          setInvitations(await listProjectInvitations(null));
          const rememberedId = localStorage.getItem('sprintflow_selected_project_id');
          const remembered = listed.find(item => item.id === rememberedId);
          if (remembered) {
            DataService.setActiveProject(remembered.id);
            applyLoadedData(await DataService.loadAll(remembered.id));
            setMembers(await listProjectMembers(remembered.id));
            setInvitations(await listProjectInvitations(remembered.id));
          } else {
            DataService.setActiveProject(null);
            setProject(null);
            setSprints([]);
            setTasks([]);
            setActivities([]);
          }
        } else {
          DataService.setActiveProject(null);
          const data = await DataService.loadAll();
          if (!current) return;
          applyLoadedData(data);
          setProjects(data.project ? [data.project] : []);
        }
      } catch (err) {
        if (current) setProjectError(err.message || 'Your projects could not be loaded.');
      } finally {
        if (current) setLoading(false);
      }
    };
    initialize();
    return () => { current = false; };
  }, [applyLoadedData, authReady, currentUser, sessionKind]);

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
    if (!(sessionKind === 'supabase' ? canProject(PERMISSIONS.EDIT_PROJECT) : can(member, PERMISSIONS.EDIT_PROJECT))) {
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
    loadData(sessionKind === 'supabase' ? localStorage.getItem('sprintflow_selected_project_id') : null);
  };

  // Only the team lead may reset, and only in local demo mode: with Supabase connected the
  // shared cloud data would be loaded again at once, so the reset would change nothing but
  // still be recorded. The board is reset, but the audit trail is kept and records who reset it.
  const resetData = async (member) => {
    if (!(sessionKind === 'supabase' ? canProject(PERMISSIONS.RESET_DEMO_DATA) : can(member, PERMISSIONS.RESET_DEMO_DATA))) {
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
  const retrySync = () => DataService.flushPending();

  // Re-read on every render; sync status changes trigger the re-render.
  const pendingChanges = getPendingChangeCount();

  // Compute metrics for active sprint or all tasks
  const activeSprintTasks = selectSprintTasks(tasks, activeSprintId);
  const sprintMetrics = calculateSprintMetrics(activeSprintTasks);

  return (
    <ProjectContext.Provider value={{
      project,
      projects,
      members,
      projectRole,
      currentMember,
      canProject,
      invitations,
      refreshProjectMembers,
      refreshInvitations,
      inviteProjectMember: async (email, role) => {
        const result = await inviteProjectMember(project?.id, email, role);
        await refreshInvitations(project?.id);
        return result;
      },
      changeProjectMemberRole: async (memberId, role) => {
        await changeProjectMemberRole(project?.id, memberId, role);
        return refreshProjectMembers(project?.id);
      },
      removeProjectMember: async memberId => {
        await removeProjectMember(project?.id, memberId);
        return refreshProjectMembers(project?.id);
      },
      manageProjectInvitation: async (invitationId, action) => {
        const result = await manageProjectInvitation(invitationId, action);
        if (action === 'resend') {
          const invitation = invitations.find(item => item.invitation_id === invitationId);
          if (invitation && project?.id) {
            await resendProjectInvitation(project.id, invitation);
          }
        }
        await refreshInvitations(project?.id);
        return result;
      },
      respondToProjectInvitation: async (invitationId, accept) => {
        await respondToProjectInvitation(invitationId, accept);
        await Promise.all([refreshInvitations(null), refreshProjects()]);
        return refreshProjectMembers(project?.id);
      },
      projectError,
      selectProject,
      refreshProjects,
      createProject,
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
