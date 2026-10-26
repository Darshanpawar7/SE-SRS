import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describeProject, validateProjectMetadata } from '../utils/projectMetadata';
import { auditProjectUpdated } from '../utils/auditTrail';
import { DataService, setSupabaseClient, toProjectRow } from '../services/supabaseClient';
import { INITIAL_PROJECT } from '../services/mockData';
import { TEAM_MEMBERS } from '../utils/constants';
import { AuthProvider } from '../context/AuthContext';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import ProjectSettingsModal from '../components/settings/ProjectSettingsModal';
import { createFakeSupabase } from './helpers/fakeSupabase';

const valid = { key: 'pms', name: '  SprintFlow Team 11  ', start_date: '2026-10-19', target_date: '2026-10-30' };

const renderDialogAs = (memberId, email) => {
  localStorage.setItem('sprintflow_session', JSON.stringify({ memberId, email }));
  return renderToStaticMarkup(
    React.createElement(AuthProvider, null,
      React.createElement(ProjectProvider, null,
        React.createElement(ProjectSettingsModal, { onClose: () => {} })))
  );
};

// Renders the real providers once and returns the project context. A static render runs
// no effects, so the project has not loaded yet.
const renderProject = () => {
  let project;
  const Capture = () => { project = useProject(); return null; };
  renderToStaticMarkup(React.createElement(AuthProvider, null,
    React.createElement(ProjectProvider, null, React.createElement(Capture))));
  return project;
};

describe('PMS-F-002 project metadata', () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: key => data.delete(key),
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    setSupabaseClient(undefined);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('accepts and normalises a valid key, name and date range', () => {
    expect(validateProjectMetadata(valid)).toEqual({
      key: 'PMS', name: 'SprintFlow Team 11', start_date: '2026-10-19', target_date: '2026-10-30'
    });
    expect(validateProjectMetadata({ ...valid, target_date: valid.start_date }).target_date).toBe('2026-10-19');
  });

  it.each(['', 'P', '1PMS', 'PM-S', 'PMS 2', 'ABCDEFGHIJK'])('rejects the invalid key %j', key => {
    expect(() => validateProjectMetadata({ ...valid, key })).toThrow('Project key must be');
  });

  it('rejects a key already used by another project, ignoring case', () => {
    expect(() => validateProjectMetadata(valid, [{ id: 'other', key: 'Pms' }])).toThrow('PMS is already used');
    expect(validateProjectMetadata(valid, [{ id: 'other', key: 'CRM' }]).key).toBe('PMS');
  });

  it.each([
    [{ name: 'AB' }, 'Project name'],
    [{ name: 'x'.repeat(81) }, 'Project name'],
    [{ start_date: '2026-02-30' }, 'valid start and end dates'],
    [{ target_date: '30/10/2026' }, 'valid start and end dates'],
    [{ start_date: '2026-11-01' }, 'on or after the start date'],
  ])('rejects invalid details %j', (change, message) => {
    expect(() => validateProjectMetadata({ ...valid, ...change })).toThrow(message);
  });

  it('saves the details and shows the same values after a reload', async () => {
    await DataService.saveProject({ ...INITIAL_PROJECT, ...validateProjectMetadata(valid) });

    expect(describeProject(await DataService.getProject())).toEqual({
      key: 'PMS', name: 'SprintFlow Team 11', dates: '2026-10-19 → 2026-10-30'
    });
  });

  it('checks key uniqueness against every Supabase project and syncs the new dates', async () => {
    const cloud = createFakeSupabase({
      projects: [{ id: INITIAL_PROJECT.id, key: 'PMS' }, { id: 'other-project', key: 'CRM' }]
    });
    setSupabaseClient(cloud);
    const others = (await DataService.listProjects()).filter(project => project.id !== INITIAL_PROJECT.id);

    expect(() => validateProjectMetadata({ ...valid, key: 'crm' }, others)).toThrow('CRM is already used');

    await DataService.saveProject({ ...INITIAL_PROJECT, ...validateProjectMetadata(valid, others) });
    expect(cloud.db.projects.find(project => project.id === INITIAL_PROJECT.id))
      .toMatchObject({ key: 'PMS', name: 'SprintFlow Team 11', start_date: '2026-10-19', target_date: '2026-10-30' });
  });

  it('rejects edits from members other than the lead, and edits before the project has loaded', async () => {
    const [lead, developer] = TEAM_MEMBERS;
    const project = renderProject();

    await expect(project.updateProject(valid, developer)).rejects.toThrow('Only the team lead can edit project details.');
    await expect(project.updateProject(valid, lead)).rejects.toThrow('The project is still loading');
  });

  it('stores new details and their audit record before Supabase answers', () => {
    vi.useFakeTimers(); // the request's 15-second time limit never fires after this test
    const cloud = createFakeSupabase({ projects: [toProjectRow(INITIAL_PROJECT)] });
    cloud.hang = true;
    setSupabaseClient(cloud);
    const updated = { ...INITIAL_PROJECT, ...validateProjectMetadata(valid) };
    const record = auditProjectUpdated(INITIAL_PROJECT, updated, 'Darshan P Pawar');

    DataService.saveProject(updated, record); // not awaited: the request never answers

    expect(JSON.parse(localStorage.getItem('sprintflow_project')).name).toBe('SprintFlow Team 11');
    expect(JSON.parse(localStorage.getItem('sprintflow_activity'))[0].id).toBe(record.id);
  });

  it('records which project fields changed in the audit trail', () => {
    const after = { ...INITIAL_PROJECT, name: 'SprintFlow Team 11', target_date: '2026-11-06' };

    expect(auditProjectUpdated(INITIAL_PROJECT, after, 'Darshan P Pawar', '2026-10-26T09:00:00.000Z')).toMatchObject({
      type: 'UPDATE',
      action: 'updated project',
      entity_type: 'project',
      actor: 'Darshan P Pawar',
      details: 'name: SprintFlow - Project Management System → SprintFlow Team 11; target_date: 2026-10-30 → 2026-11-06'
    });
    expect(auditProjectUpdated(INITIAL_PROJECT, { ...INITIAL_PROJECT }, 'Darshan P Pawar')).toBeNull();
  });

  it('lets only the team lead edit; other members see the details read-only', () => {
    const leadView = renderDialogAs('u-1', 'darshan@pes.edu');
    expect(leadView).toContain('Save Project');
    expect(leadView).not.toContain('Only the team lead can edit');

    const memberView = renderDialogAs('u-2', 'dhatri@pes.edu');
    expect(memberView).toContain('Only the team lead can edit project details.');
    expect(memberView).not.toContain('Save Project');
    expect(memberView).toContain('readonly=""');
  });

  it('falls back to placeholder text before the project has loaded', () => {
    expect(describeProject(null)).toEqual({ key: 'PMS', name: 'Project Management', dates: '' });
  });
});
