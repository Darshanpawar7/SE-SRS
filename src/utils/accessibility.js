export function activateCardFromKeyDown(event, activate) {
  if (event.target !== event.currentTarget) return false;
  if (event.key !== 'Enter' && event.key !== ' ') return false;

  event.preventDefault();
  activate();
  return true;
}
