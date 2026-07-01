import { createHttpError } from './httpError.js';
import { ROLES, SUB_ADMIN_MODERATABLE_STATUSES } from '../constants/roles.js';

const MODERATABLE_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];

export const getAllowedListingStatuses = (actorRole) => (
  actorRole === ROLES.SUB_ADMIN ? SUB_ADMIN_MODERATABLE_STATUSES : MODERATABLE_STATUSES
);

export const assertAllowedListingStatus = (status, actorRole) => {
  const allowedStatuses = getAllowedListingStatuses(actorRole);

  if (!allowedStatuses.includes(status)) {
    throw createHttpError(
      400,
      actorRole === ROLES.SUB_ADMIN
        ? 'Sub-admin can only set status to APPROVED or SUSPENDED'
        : 'status must be PENDING, APPROVED, or SUSPENDED'
    );
  }
};
