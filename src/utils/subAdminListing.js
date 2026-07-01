import { ROLES } from '../constants/roles.js';

export const isSubAdminRole = (role) => role === ROLES.SUB_ADMIN;

export const isComplimentaryListingPurchase = (role, planPrice) =>
  isSubAdminRole(role) || !planPrice || Number(planPrice) <= 0;

export const getComplimentaryPaymentAmount = (role, planPrice) =>
  (isSubAdminRole(role) ? 0 : Number(planPrice || 0));

export const shouldAutoPublishSubAdminListing = (role, isRenewal) =>
  isSubAdminRole(role) && !isRenewal;

export const getComplimentaryPlanExpiryDate = (startDate, plan, fallbackDays = 30) => {
  const expiryDate = new Date(startDate);
  const durationDays = Number(plan?.duration);

  if (Number.isInteger(durationDays) && durationDays > 0) {
    expiryDate.setDate(expiryDate.getDate() + durationDays);
    return expiryDate;
  }

  expiryDate.setDate(expiryDate.getDate() + fallbackDays);
  return expiryDate;
};
