import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  addLabel,
  addLabels,
  getDistinctLabels,
  MAX_LABEL_LENGTH,
  normalizeLabel,
  removeLabel
} from '../utils/labels';
import LabelPills from '../components/kanban/LabelPills';
import { DataService } from '../services/supabaseClient';

describe('PMS-F-007 task labels and tags', () => {
  beforeEach(() => {
    const data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: key => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: key => data.delete(key),
    });
  });

  it('normalises typed labels into short lowercase tags', () => {
    expect(normalizeLabel('  #Front End ')).toBe('front-end');
    expect(normalizeLabel('API')).toBe('api');
    expect(normalizeLabel('##')).toBe('');
    expect(normalizeLabel(42)).toBe('');
    expect(normalizeLabel('x'.repeat(40))).toHaveLength(MAX_LABEL_LENGTH);
  });

  it('adds a label once and ignores blank or duplicate input', () => {
    const labels = addLabel(['ui'], 'Backend');
    expect(labels).toEqual(['ui', 'backend']);
    expect(addLabel(labels, ' UI ')).toEqual(['ui', 'backend']);
    expect(addLabel(labels, '   ')).toEqual(['ui', 'backend']);
    expect(addLabels([], 'api, ui ,, API')).toEqual(['api', 'ui']);
  });

  it('removes only the chosen label', () => {
    expect(removeLabel(['ui', 'backend', 'api'], 'backend')).toEqual(['ui', 'api']);
    expect(removeLabel(['ui'], '#UI')).toEqual([]);
    expect(removeLabel(['ui'], 'missing')).toEqual(['ui']);
  });

  it('cleans legacy label lists that contain duplicates or non-text values', () => {
    expect(getDistinctLabels(['UI', 'ui', null, '', 'api'])).toEqual(['ui', 'api']);
    expect(getDistinctLabels(undefined)).toEqual([]);
  });

  it('renders one distinct pill per saved label on the task card', () => {
    const html = renderToStaticMarkup(React.createElement(LabelPills, { labels: ['UI', 'ui', 'api'] }));
    expect(html.match(/class="label-tag"/g)).toHaveLength(2);
    expect(html).toContain('#ui');
    expect(html).toContain('#api');
    expect(renderToStaticMarkup(React.createElement(LabelPills, { labels: [] }))).toBe('');
    expect(renderToStaticMarkup(React.createElement(LabelPills, {}))).toBe('');
  });

  it('keeps added and removed labels across a save and reload', async () => {
    const task = { id: 't1', title: 'Tag me', story_points: 3, labels: addLabels([], 'ui, api') };
    await DataService.saveTasks([task]);
    expect((await DataService.getTasks())[0].labels).toEqual(['ui', 'api']);

    await DataService.saveTasks([{ ...task, labels: removeLabel(task.labels, 'ui') }]);
    expect((await DataService.getTasks())[0].labels).toEqual(['api']);
  });
});
