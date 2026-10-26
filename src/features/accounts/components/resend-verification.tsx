"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { initialAccountFormState } from "../form-state";
import { verificationAction } from "../actions";
import styles from "./resend-verification.module.css";

export const RESEND_COOLDOWN_SECONDS = 30;

export function ResendVerification({ email, active }: { email: string; active: boolean }) {
  const [state, dispatch] = useActionState(verificationAction, initialAccountFormState);
  const [pending, startTransition] = useTransition();
  const [cycle, setCycle] = useState(0);

  if (!active || !email) return null;

  return <div className={styles.resend} data-resend-verification>
    <p className={styles.lead}>¿No recibiste el correo de confirmación?</p>
    <CooldownButton key={cycle} pending={pending} onSend={() => {
      const data = new FormData();
      data.set("email", email);
      setCycle(value => value + 1);
      startTransition(() => dispatch(data));
    }} />
    <p id="resend-verification-status" role="status" aria-live="polite" className={styles.message}>{state.message}</p>
  </div>;
}

/** Remounted per cycle, so every resend starts a fresh 30 second wait. */
function CooldownButton({ pending, onSend }: { pending: boolean; onSend: () => void }) {
  const [remaining, setRemaining] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    let left = RESEND_COOLDOWN_SECONDS;
    const timer = window.setInterval(() => {
      left = Math.max(0, left - 1);
      setRemaining(left);
      if (left === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const waiting = remaining > 0;
  return <Button variant="secondary" size="sm" busy={pending} busyLabel="Enviando…" disabled={waiting}
    aria-describedby="resend-verification-status" onClick={onSend}>
    {waiting ? `Reenviar en ${remaining} s` : "Reenviar correo de confirmación"}
  </Button>;
}
