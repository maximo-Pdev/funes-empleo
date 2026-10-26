import Link from "next/link";
import { MailWarning } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AccessNotice } from "@/features/accounts/components/access-notice";
import home from "@/app/(public)/home.module.css";
import styles from "./verification-expired.module.css";
export default function ExpiredVerificationPage() {
  return <main className={styles.page}>
    <div className={styles.shell}>
      <p className={styles.identity}>Oficina de Empleo · Municipalidad de Funes</p>
      <section className={`${home.panel} surface-bevel form-compact`} aria-labelledby="verification-expired-title">
        <div className={home.panelContent}>
          <h1 id="verification-expired-title" className={styles.title}>Enlace de verificación inválido o vencido</h1>
          <div className={styles.notice}>
            <AccessNotice tone="alert" icon={MailWarning}>Solicitá un enlace nuevo. No es necesario crear otra cuenta.</AccessNotice>
          </div>
          <AuthForm mode="verification" homepageLayout />
          <div className={home.recovery}>
            <hr className={home.separator} />
            <Link className={home.recoveryLink} href="/">Volver al inicio</Link>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
