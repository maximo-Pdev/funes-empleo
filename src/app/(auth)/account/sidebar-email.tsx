"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./account.module.css";

export function SidebarEmail({ email }: { email: string }) {
  const viewport = useRef<HTMLParagraphElement>(null);
  const value = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState({ overflow: false, duration: 7 });

  useEffect(() => {
    let active = true;
    const measure = () => {
      if (!active || !viewport.current || !value.current) return;
      const available = viewport.current.clientWidth;
      const width = value.current.scrollWidth;
      const overflow = available > 0 && width > available;
      const duration = Math.max(7, (width + 24) / 28);
      setMetrics(previous => previous.overflow === overflow && previous.duration === duration
        ? previous : { overflow, duration });
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (viewport.current) observer?.observe(viewport.current);
    if (value.current) observer?.observe(value.current);
    window.addEventListener("resize", measure);
    document.fonts?.addEventListener("loadingdone", measure);
    void document.fonts?.ready.then(measure);
    measure();
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      document.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [email]);

  return <p ref={viewport} className={styles.email} data-overflow={metrics.overflow}
    title={email} tabIndex={metrics.overflow ? 0 : undefined}
    style={{ "--email-duration": `${metrics.duration}s` } as CSSProperties}>
    <span className={styles.emailTrack}>
      <span className={styles.emailCopy}><span ref={value} className={styles.emailValue}>{email}</span></span>
      {metrics.overflow && <span className={styles.emailCopy} aria-hidden="true">{email}</span>}
    </span>
  </p>;
}
