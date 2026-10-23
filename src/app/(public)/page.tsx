import { HomeAccessPanel } from "./home-access-panel";
import { HomeAccountNav } from "./home-account-nav";
import { HomeNavbar } from "./home-navbar";
import { HomeRibbons } from "./home-ribbons";
import Image from "next/image";
import { ArrowDown, Building2, ShieldCheck, Users } from "lucide-react";
import { getAccountAccess } from "@/features/accounts/navigation";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const accountAccess = await getAccountAccess();
  return (
    <>
      <HomeNavbar />
      <main id="contenido" tabIndex={-1} className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.brand}>
            <HomeRibbons />
            <div className={styles.introduction}>
              <div className={styles.introIdentity}>
                <Image src="/brand/logo-funes-verde.svg" alt="" width={48} height={48} />
                <p><strong>Oficina de Empleo</strong><span>Municipalidad de Funes</span></p>
              </div>
              <HomeAccountNav href={accountAccess.href} label={accountAccess.label} />
              <h1 className={styles.headline}>El empleo en Funes, con acompañamiento municipal.</h1>
              <p className={styles.introSummary}>Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar.</p>
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
              <div className={styles.introNotice}>
                <ShieldCheck size={22} aria-hidden="true" />
                <p>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
              </div>
            </div>
          </div>
          <div className={styles.access}>
            <HomeAccessPanel />
          </div>
          <div className={styles.offersFooter}>
            <a className={styles.offersAction} href="#ofertas-disponibles">
              Ver ofertas disponibles
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <section id="ofertas-disponibles" tabIndex={-1} className={styles.information} aria-label="Información del portal" />
      </main>
    </>
  );
}
