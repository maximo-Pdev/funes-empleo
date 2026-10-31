import styles from "./workflow-steps.module.css";

export type WorkflowStep = { label: string; state: "completed" | "current" | "pending" };
const stateLabels = { completed: "Completada", current: "Actual", pending: "Pendiente" };

export function WorkflowSteps({ label, steps }: { label: string; steps: readonly WorkflowStep[] }) {
  return <ol aria-label={label} className={styles.steps}>
    {steps.map((step, index) => <li key={step.label} data-state={step.state}
      aria-current={step.state === "current" ? "step" : undefined} className={styles.step}>
      <span aria-hidden="true" className={styles.circle}>{index + 1}</span>
      <span className={styles.label}>{step.label}</span>
      <span className={styles.status}>{stateLabels[step.state]}</span>
    </li>)}
  </ol>;
}
