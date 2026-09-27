// Evidence evaluator, not synthetic claims about human performance.
export const budgets = { searchPreselection: 300000, metricsExport: 30000, candidateSearch: 3000,
  openingList: 3000, companyList: 3000, cvDownload: 10000, csvPreview: 30000,
  csvConfirm: 60000, concurrentMutation: 5000 } as const;
export type Measurement = { case: keyof typeof budgets; elapsedMs: number; deployment: string;
  commit: string; date: string; fixtureHash: string; resetId: string; browser: string;
  device: string; connection: string; participantId: string; cold: boolean;
  completed: boolean; expectedDataVerified: boolean };
export function assessMeasurement(m: Measurement, expectedHash: string) {
  const metadata = [m.deployment,m.commit,m.date,m.resetId,m.browser,m.device,m.connection,m.participantId];
  if (metadata.some((v) => !v.trim()) || !m.deployment.startsWith("https://") ||
      m.fixtureHash !== expectedHash || !m.cold || !m.completed || !m.expectedDataVerified ||
      !Number.isFinite(m.elapsedMs) || m.elapsedMs < 0) return false;
  const exclusive = m.case === "searchPreselection" || m.case === "metricsExport";
  return exclusive ? m.elapsedMs < budgets[m.case] : m.elapsedMs <= budgets[m.case];
}
export function assessColdSeries(measurements: readonly Measurement[], hash: string) {
  return measurements.length > 0 && new Set(measurements.map((m) => m.resetId)).size === measurements.length &&
    new Set(measurements.map((m) => m.deployment)).size === 1 && measurements.every((m) => assessMeasurement(m,hash));
}
export function assessTimedCohort(runs: readonly { participantId: string; elapsedMs: number; completed: boolean; helped: boolean }[]) {
  return runs.length === 10 && new Set(runs.map((r) => r.participantId)).size >= 5 &&
    runs.filter((r) => r.completed && !r.helped && r.elapsedMs >= 0 && r.elapsedMs < 600000).length >= 9;
}
export function assessFirstAttempt(runs: readonly { participantId: string; completed: boolean; helped: boolean; restarted: boolean }[], minimum: number) {
  return runs.length >= minimum && new Set(runs.map((r) => r.participantId)).size === runs.length &&
    runs.filter((r) => r.completed && !r.helped && !r.restarted).length / runs.length >= 0.8;
}
