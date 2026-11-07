export const isLeadRole = role => role === 'lead' || role === 'owner';
export const canManageMembers = role => isLeadRole(role);
export const canCreateSprints = role => isLeadRole(role) || role === 'scrum_master';
export const shouldShowBoardEmptyState = sprints => (sprints ?? []).length === 0;
