"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { Field } from "@/components/forms/field";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import styles from "./home.module.css";

export function HomeAccessPanel() {
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
        aria-label="Acceso al portal" data-mode={mode} style={panelHeight ? { height: panelHeight } : undefined}>
        <div ref={contentRef} className={styles.panelContent}>
          <div className={styles.modes} role="group" aria-label="Opciones de acceso">
            <button type="button" aria-pressed={mode === "login"} onClick={() => setMode("login")}>Iniciar sesión</button>
            <button type="button" aria-pressed={mode === "register"} onClick={() => setMode("register")}>Registrarse</button>
          </div>
          {mode === "register" && (
            <fieldset className={styles.roles}>
              <legend className="sr-only">Tipo de cuenta</legend>
              <div className={styles.roleOptions}>
                <span aria-hidden="true">Tipo de cuenta</span>
                <Field><input type="radio" name="accountType" value="candidate" checked={role === "candidate"} onChange={() => setRole("candidate")} />Postulante</Field>
                <Field><input type="radio" name="accountType" value="company" checked={role === "company"} onChange={() => setRole("company")} />Empresa</Field>
              </div>
            </fieldset>
          )}
          <div className={styles.form}>
            {mode === "login" ? <AuthForm mode="login" submitLabel="Ingresar" />
              : role === "candidate" ? <CandidateRegistrationForm submitLabel="Registrarse" homepageLayout />
                : <CompanyRegistrationForm submitLabel="Registrarse" homepageLayout />}
            {mode === "login" && (
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
