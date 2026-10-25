"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Info, KeyRound } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { Field } from "@/components/forms/field";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { HomeAccountNav } from "./home-account-nav";
import styles from "./home.module.css";

export type HomeAccessView = "login" | "candidate" | "company";

export function HomeAccessPanel({ authenticated = false, panelHref, panelLabel = "Ir al panel de usuario", onViewChange }: { authenticated?: boolean; panelHref?: string; panelLabel?: string; onViewChange?: (view: HomeAccessView) => void } = {}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"candidate" | "company">("candidate");
  const contentRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>();

  useLayoutEffect(() => {
    const content = contentRef.current;
    const panel = content?.parentElement;
    if (!content || !panel || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setPanelHeight(content.getBoundingClientRect().height + panel.offsetHeight - panel.clientHeight);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.accessGroup} data-layout={mode === "register" ? role : "login"}>
      <section className={`${styles.panel} surface-bevel form-compact`}
        id="acceso" tabIndex={-1} aria-label="Acceso al portal" data-mode={mode} style={panelHeight ? { height: panelHeight } : undefined}>
        <div ref={contentRef} className={styles.panelContent}>
          <div className={styles.modes} role="group" aria-label="Opciones de acceso">
            <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); onViewChange?.("login"); }}>Iniciar sesión</button>
            <button type="button" aria-pressed={mode === "register"} onClick={() => { setMode("register"); onViewChange?.(role); }}>Registrarse</button>
          </div>
          {mode === "register" && (
            <fieldset className={styles.roles}>
              <legend className="sr-only">Tipo de cuenta</legend>
              <div className={styles.roleOptions}>
                <span aria-hidden="true">Tipo de cuenta</span>
                <Field><input type="radio" name="accountType" value="candidate" checked={role === "candidate"} onChange={() => { setRole("candidate"); onViewChange?.("candidate"); }} />Postulante</Field>
                <Field><input type="radio" name="accountType" value="company" checked={role === "company"} onChange={() => { setRole("company"); onViewChange?.("company"); }} />Empresa</Field>
              </div>
            </fieldset>
          )}
          <div className={styles.form}>
            {mode === "login" ? authenticated
              ? <>
                <p role="status" className={styles.sessionMessage}><Info size={16} aria-hidden="true" />Ya tenés la sesión iniciada</p>
                {panelHref && <div className={styles.sessionActions}>
                  <HomeAccountNav href={panelHref} label={panelLabel} />
                </div>}
              </>
              : <AuthForm mode="login" submitLabel="Ingresar" homepageLayout />
              : role === "candidate" ? <CandidateRegistrationForm submitLabel="Registrarse" homepageLayout />
                : <CompanyRegistrationForm submitLabel="Registrarse" homepageLayout />}
            {mode === "login" && !authenticated && (
              <div className={styles.recovery}>
                <hr className={styles.separator} />
                <Link className={styles.recoveryLink} href="/recover">
                  <KeyRound size={16} aria-hidden="true" />
                  Recuperar acceso
                </Link>
              </div>
            )}
            {mode === "register" && <p className="mt-3 text-center">Los campos marcados con * son obligatorios.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
