import { STORY_POINTS } from './constants';

// Keep the persistence boundary as strict as the estimate buttons.
export function validateStoryPoints(value) {
  if (typeof value !== 'number' || !STORY_POINTS.includes(value)) {
    throw new Error('Story points must be one of 1, 2, 3, 5, 8, 13, or 21.');
  }
  return value;
}
