"use client";

import { useState } from "react";
import { ArrowDown, Building2, ShieldCheck, Users } from "lucide-react";
import { registrationContent } from "@/features/accounts/registration-content";
import type { AccessState } from "@/features/accounts/access-notices";
import { HomeAccessPanel, type HomeAccessView } from "./home-access-panel";
import { HomeRibbons } from "./home-ribbons";
import styles from "./home.module.css";

export function HomeHero({ authenticated, panelHref, panelLabel, initialView = "login", accessState = null }: { authenticated: boolean; panelHref?: string; panelLabel?: string; initialView?: HomeAccessView; accessState?: AccessState | null }) {
  const [view, setView] = useState<HomeAccessView>(initialView);
  const copy = view === "login" ? null : registrationContent[view];

  return (
    <div className={styles.hero}>
      <div className={styles.brand}>
        <HomeRibbons />
        <div key={view} className={styles.introduction} data-view={view}>
          <h1 className={styles.headline}>{copy?.guide ?? "El empleo en Funes, con acompañamiento municipal."}</h1>
          <p className={styles.introSummary}>{copy?.introduction ?? "Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar."}</p>
          {copy ? (
            <ol className={`${styles.introRoles} ${styles.introSteps}`} aria-label="Pasos para empezar">
              {copy.steps.map(([title, description], index) => (
                <li key={title}>
                  <span className={`${styles.introIcon} ${styles.introStepNumber}`} aria-hidden="true">{index + 1}</span>
                  <div><h2>{title}</h2><p>{description}</p></div>
                </li>
              ))}
            </ol>
          ) : (
            <ul className={styles.introRoles}>
              <li>
                <span className={styles.introIcon} aria-hidden="true"><Users size={20} /></span>
                <div><h2>Postulantes</h2><p>Completá tu perfil y postulate a ofertas vigentes.</p></div>
              </li>
              <li>
                <span className={styles.introIcon} aria-hidden="true"><Building2 size={20} /></span>
                <div><h2>Empresas</h2><p>Gestioná tus ofertas y los perfiles derivados por la Oficina.</p></div>
              </li>
            </ul>
          )}
          {view === "company" && (
            <div className={styles.introDisclaimer}>
              <p><strong>Sin verificación documental</strong></p>
              <p>Verificar el correo confirma el acceso a la cuenta; no acredita la identidad de la empresa. Cada oferta requiere revisión municipal.</p>
            </div>
          )}
          <div className={styles.introNotice}>
            <ShieldCheck size={22} aria-hidden="true" />
            <p>{copy?.privacy ?? registrationContent.candidate.privacy}</p>
          </div>
        </div>
      </div>
      <div className={styles.access}>
        <HomeAccessPanel authenticated={authenticated} panelHref={panelHref} panelLabel={panelLabel} onViewChange={setView} initialView={initialView} accessState={accessState} />
        <div className={styles.offersFooter}>
          <a className={styles.offersAction} href="#ofertas-disponibles">
            Ver ofertas disponibles
            <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
