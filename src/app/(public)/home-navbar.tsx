"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

function subscribeToVisibility(onChange: () => void) {
  const mobile = window.matchMedia?.("(max-width: 767px)");
  window.addEventListener("scroll", onChange, { passive: true });
  mobile?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    mobile?.removeEventListener("change", onChange);
  };
}

function isNavbarVisible() {
  return Boolean(window.matchMedia?.("(max-width: 767px)").matches) || window.scrollY > 0;
}

function serverSnapshot() {
  return false;
}

export function HomeNavbar({ alwaysVisible = false }: { alwaysVisible?: boolean } = {}) {
  const scrollVisible = useSyncExternalStore(subscribeToVisibility, isNavbarVisible, serverSnapshot);
  const visible = alwaysVisible || scrollVisible;

  return (
    <header className={styles.navbar} data-home={!alwaysVisible} data-visible={visible} aria-hidden={!visible} inert={!visible}>
      <nav aria-label="Navegación principal" className={styles.navbarContent}>
        <a className={styles.navbarBrand} href="https://funes.gob.ar/" aria-label="Ir al sitio de la Municipalidad de Funes">
          <Image src="/brand/funes-navbar-emblem.svg" alt="Municipalidad de Funes" width={225} height={235} />
        </a>
        <div className={styles.navbarLinks}>
          {alwaysVisible ? <Link href="/">Inicio</Link> : <a href="#contenido">Inicio</a>}
          <Link href="/ofertas">Ofertas</Link>
        </div>
      </nav>
    </header>
  );
}
