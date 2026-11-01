import type { ReactNode } from "react";
import { HomeNavbar } from "../home-navbar";
import styles from "./public-offers.module.css";

export function PublicOffersShell({ panel, children }: {
  panel: { href: string; label: string } | null;
  children: ReactNode;
}) {
  return <div className={styles.page}>
    <HomeNavbar alwaysVisible panel={panel} notifications={panel !== null} />
    <main id="contenido" tabIndex={-1} className={styles.main}>
      <div className={styles.canvas}>{children}</div>
    </main>
  </div>;
}
