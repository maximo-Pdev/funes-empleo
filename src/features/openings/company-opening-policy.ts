export const companyEditableOpeningStatuses = ["draft", "changes_requested", "published"] as const;
export const companyCancellableOpeningStatuses = ["draft", "pending_review", "changes_requested", "published", "paused", "suspended"] as const;
export const canEditCompanyOpening = (status: string) => companyEditableOpeningStatuses.some(value => value === status);
export const canCancelCompanyOpening = (status: string) => companyCancellableOpeningStatuses.some(value => value === status);
