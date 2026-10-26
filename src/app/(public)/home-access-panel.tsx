"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, Clock3, Info, KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AccessNotice } from "@/features/accounts/components/access-notice";
import { ResendVerification } from "@/features/accounts/components/resend-verification";
import type { AccessState } from "@/features/accounts/access-notices";
import { Field } from "@/components/forms/field";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { HomeAccountNav } from "./home-account-nav";
import { HOME_REGISTRATION_EVENT } from "@/features/accounts/registration-navigation";
import styles from "./home.module.css";

export type HomeAccessView = "login" | "candidate" | "company";

/** Values typed in one access form, so switching tabs does not erase them. */
type FormDrafts = Record<string, Record<string, string>>;


export function HomeAccessPanel({ authenticated = false, panelHref, panelLabel = "Ir al panel de usuario", onViewChange, initialView = "login", accessState = null }: { authenticated?: boolean; panelHref?: string; panelLabel?: string; onViewChange?: (view: HomeAccessView) => void; initialView?: HomeAccessView; accessState?: AccessState | null } = {}) {
  const [mode, setMode] = useState<"login" | "register">(initialView === "login" ? "login" : "register");
  const [role, setRole] = useState<"candidate" | "company">(initialView === "company" ? "company" : "candidate");
  const notice = authenticated ? null : accessState;
  const contentRef = useRef<HTMLDivElement>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);
  const [panelHeight, setPanelHeight] = useState<number>();
  const [sent, setSent] = useState<{ email: string; message: string } | null>(null);
  const [drafts, setDrafts] = useState<FormDrafts>({});

  /** Reads the mounted form before a tab, role or submit change replaces it. */
  const rememberValues = useCallback(() => {
    const content = contentRef.current;
    const form = content?.querySelector("form");
    const key = content?.dataset.accessKey;
    if (!form || !key) return;
    const entries: Record<string, string> = {};
    for (const [field, value] of new FormData(form).entries()) {
      if (typeof value !== "string") continue;
      entries[field] = value;
    }
    setDrafts(previous => ({
      ...previous,
      [key]: { ...previous[key], ...entries },
    }));
  }, []);

  /** Restore only this form's draft; credentials and confirmation never cross forms. */
  const draftFor = (key: string) => drafts[key];

  /** Stable identity: the form reports success from an effect that lists this callback. */
  const handleSent = useCallback((result: { email: string; message: string }) => {
    rememberValues();
    setSent(result);
  }, [rememberValues]);

  useEffect(() => { if (sent) sentHeading.current?.focus(); }, [sent]);

  /** Capture what was typed before the confirmation replaces the form. */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const onSubmit = () => rememberValues();
    content.addEventListener("submit", onSubmit, true);
    return () => content.removeEventListener("submit", onSubmit, true);
  }, [rememberValues]);

  useEffect(() => {
    let focusFrame: number | undefined;
    const focusRegistration = () => {
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => {
        const panel = contentRef.current?.closest<HTMLElement>("#acceso");
        if (!panel) return;
        panel.focus({ preventScroll: true });
        window.scrollTo({ top: 0, left: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      });
    };
    const openRegistration = (event: Event) => {
      if (!(event instanceof CustomEvent) || (event.detail !== "candidate" && event.detail !== "company")) return;
      rememberValues();
      setMode("register");
      setRole(event.detail);
      onViewChange?.(event.detail);
      focusRegistration();
    };
    window.addEventListener(HOME_REGISTRATION_EVENT, openRegistration);
    if (initialView !== "login") focusRegistration();
    return () => {
      window.removeEventListener(HOME_REGISTRATION_EVENT, openRegistration);
      if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
    };
  }, [initialView, onViewChange, rememberValues]);

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
        <div ref={contentRef} className={styles.panelContent} data-access-key={mode === "login" ? "login" : role}>
          <div className={styles.modes} role="group" aria-label="Opciones de acceso">
            <button type="button" aria-pressed={mode === "login"} onClick={() => { rememberValues(); setMode("login"); setSent(null); onViewChange?.("login"); }}>Iniciar sesión</button>
            <button type="button" aria-pressed={mode === "register"} onClick={() => { rememberValues(); setMode("register"); setSent(null); onViewChange?.(role); }}>Registrarse</button>
          </div>
          {mode === "register" && !sent && (
            <fieldset className={styles.roles}>
              <legend className="sr-only">Tipo de cuenta</legend>
              <div className={styles.roleOptions}>
                <span aria-hidden="true">Tipo de cuenta</span>
                <Field><input type="radio" name="accountType" value="candidate" checked={role === "candidate"} onChange={() => { rememberValues(); setRole("candidate"); setSent(null); onViewChange?.("candidate"); }} />Postulante</Field>
                <Field><input type="radio" name="accountType" value="company" checked={role === "company"} onChange={() => { rememberValues(); setRole("company"); setSent(null); onViewChange?.("company"); }} />Empresa</Field>
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
              : notice === "suspended" ? (
                <div className={styles.accessNotice}>
                  <AccessNotice tone="alert" icon={ShieldAlert} title="Acceso suspendido">
                    Contactá a la Oficina de Empleo para consultar tu situación. El portal no muestra los motivos internos de la suspensión.
                  </AccessNotice>
                </div>
              ) : notice === "recovery-invalid" ? (
                <>
                  <div className={styles.accessNotice}>
                    <AccessNotice tone="alert" icon={CircleAlert} title="Enlace de recuperación inválido o vencido">
                      Solicitá un enlace nuevo y abrilo una sola vez.
                    </AccessNotice>
                  </div>
                  <AuthForm mode="recovery" submitLabel="Solicitar enlace" homepageLayout defaultValues={draftFor("login")} />
                </>
              ) : (
                <>
                  {notice === "session-expired" && <div className={styles.accessNotice}>
                    <AccessNotice tone="info" icon={Clock3} title="Volvé a iniciar sesión">
                      No hay una sesión habilitada. Puede haber vencido o haberse cerrado. Iniciá sesión nuevamente para continuar.
                    </AccessNotice>
                  </div>}
                  <AuthForm mode="login" submitLabel="Ingresar" homepageLayout defaultValues={draftFor("login")} />
                </>
              )
              : null}
            {mode === "register" && sent && (
              <div className={styles.registrationSent}>
                <h2 ref={sentHeading} tabIndex={-1} className={styles.sentTitle}>
                  <MailCheck size={20} aria-hidden="true" />
                  Revisá tu correo electrónico
                </h2>
                <p className={styles.sentMessage}>{sent.message}</p>
                <ResendVerification email={sent.email} active />
                <div className={styles.recovery}>
                  <hr className={styles.separator} />
                  <Link className={styles.recoveryLink} href="/" onClick={() => { rememberValues(); setMode("login"); setSent(null); onViewChange?.("login"); }}>Volver a iniciar sesión</Link>
                </div>
              </div>
            )}
            {/* One form at a time: it is remounted from the captured draft, so every tab keeps what was typed. */}
            {mode === "register" && !sent && (role === "candidate"
              ? <CandidateRegistrationForm homepageLayout onSent={handleSent} defaultValues={draftFor(role)} />
              : <CompanyRegistrationForm homepageLayout onSent={handleSent} defaultValues={draftFor(role)} />)}
            {mode === "login" && !authenticated && notice !== "suspended" && (
              <div className={styles.recovery}>
                <hr className={styles.separator} />
                {notice === "recovery-invalid"
                  ? <Link className={styles.recoveryLink} href="/">Volver a iniciar sesión</Link>
                  : <Link className={styles.recoveryLink} href="/recover">
                    <KeyRound size={16} aria-hidden="true" />
                    Recuperar acceso
                  </Link>}
              </div>
            )}
            {mode === "register" && !sent && <p className="mt-3 text-center">Los campos marcados con * son obligatorios.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
