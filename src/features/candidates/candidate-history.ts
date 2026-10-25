export const candidateHistoryActions = [
  "profile_activated", "consent_accepted", "consent_withdrawn", "availability_changed",
  "account_suspended", "account_reactivated", "profile_linked", "freshness_due",
] as const;

export const candidateHistoryPageSize = 5;
export type CandidateHistoryEvent = { id: string; action: typeof candidateHistoryActions[number]; occurred_at: string };
export type CandidateHistoryCursor = { occurredAt: string; id: string };
export type CandidateHistoryPage = { events: CandidateHistoryEvent[]; nextCursor: CandidateHistoryCursor | null };
export type CandidateHistoryResult = { success: true; page: CandidateHistoryPage } | { success: false; message: string };
