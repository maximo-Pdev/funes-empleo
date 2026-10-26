import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./access-notice.module.css";

export function AccessNotice({ icon: Icon, title, tone = "info", children }: {
  icon: LucideIcon;
  title?: string;
  tone?: "info" | "alert";
  children: ReactNode;
}) {
  return (
    <div className={styles.notice} data-tone={tone}>
      <span className={styles.icon} aria-hidden="true"><Icon size={18} /></span>
      <div className={styles.body}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  );
}
