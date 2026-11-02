import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildTaskPayload, validateTaskForm } from '../utils/taskForm';
import { validateProjectMetadata } from '../utils/projectMetadata';
import { getDistinctLabels } from '../utils/labels';
import { sanitizeUserText } from '../utils/userText';
import LabelPills from '../components/kanban/LabelPills';
import { TEAM_MEMBERS } from '../utils/constants';

describe('shared user text sanitization', () => {
  it('neutralizes script and HTML payloads in task title, description, and tags before saving', () => {
    const payload = buildTaskPayload({
      title: 'Fix <script>alert(1)</script> safely',
      description: 'Details <img src=x onerror="alert(1)"> remain readable',
      status: 'todo',
      priority: 'high',
      storyPoints: 3,
      assigneeId: TEAM_MEMBERS[0].id,
      sprintId: '',
      labels: ['<script>alert(1)</script>security', '<img src=x onerror=alert(1)>urgent']
    }, TEAM_MEMBERS[0], TEAM_MEMBERS);

    expect(payload.title).toBe('Fix  safely');
    expect(payload.description).toBe('Details  remain readable');
    expect(payload.labels).toEqual(['security', 'urgent']);
    expect(JSON.stringify(payload)).not.toMatch(/<script|<img|onerror|alert\(1\)/i);
  });

  it('neutralizes project name and description and enforces their length limits', () => {
    expect(validateProjectMetadata({
      key: 'PMS', name: 'PM <script>alert(1)</script>S', description: 'Plan <img src=x onerror=alert(1)> safe',
      start_date: '2026-10-19', target_date: '2026-10-30'
    })).toMatchObject({ name: 'PM S', description: 'Plan  safe' });

    expect(() => validateProjectMetadata({
      key: 'PMS', name: 'Project', description: 'x'.repeat(2001),
      start_date: '2026-10-19', target_date: '2026-10-30'
    })).toThrow('Project description must be 2000 characters or fewer');
  });

  it('cleans tag and search-view text, while React renders tags as text', () => {
    const labels = getDistinctLabels(['<img src=x onerror=alert(1)>Urgent']);
    const markup = renderToStaticMarkup(React.createElement(LabelPills, { labels }));

    expect(labels).toEqual(['urgent']);
    expect(markup).toContain('#urgent');
    expect(markup).not.toContain('<img');
    expect(sanitizeUserText('<script>alert(1)</script><img onerror=alert(1)>needle')).toBe('needle');
  });

  it('enforces task title, description, and tag limits and rejects a title sanitized to blank', () => {
    expect(validateTaskForm({ title: '<script>alert(1)</script>', priority: 'high' })).toBe(false);
    expect(() => sanitizeUserText('x'.repeat(121), { field: 'Task title', maxLength: 120 })).toThrow();
    expect(() => sanitizeUserText('x'.repeat(25), { field: 'Tag', maxLength: 24 })).toThrow('Tag must be 24 characters or fewer');
  });
});
