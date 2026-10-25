"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function hasScrolled() {
  return window.scrollY > 0;
}

type PanelAccess = { href: string; label: string };

export function HomeNavbar({ alwaysVisible = false, panel = null }: { alwaysVisible?: boolean; panel?: PanelAccess | null } = {}) {
  const pathname = usePathname();
  const homeCurrent = pathname === "/" ? "page" : undefined;
  const offersCurrent = pathname === "/ofertas" || pathname?.startsWith("/ofertas/") ? "page" : undefined;
  const panelCurrent = panel && pathname === panel.href ? "page" : undefined;
  const scrollVisible = useSyncExternalStore(subscribeToVisibility, isNavbarVisible, serverSnapshot);
  const scrolled = useSyncExternalStore(subscribeToVisibility, hasScrolled, serverSnapshot);
  const [lingering, setLingering] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (alwaysVisible) return;
    const mobile = window.matchMedia?.("(max-width: 767px)");
    let wasScrolled = window.scrollY > 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancelTimer = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const onScroll = () => {
      const belowTop = window.scrollY > 0;
      if (belowTop || mobile?.matches) {
        cancelTimer();
        setLingering(false);
      } else if (wasScrolled) {
        cancelTimer();
        setLingering(true);
        timer = setTimeout(() => { setLingering(false); timer = undefined; }, 2000);
      }
      wasScrolled = belowTop;
    };
    const onViewportChange = () => {
      cancelTimer();
      setLingering(false);
      setHovered(false);
      wasScrolled = window.scrollY > 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    mobile?.addEventListener("change", onViewportChange);
    return () => {
      cancelTimer();
      window.removeEventListener("scroll", onScroll);
      mobile?.removeEventListener("change", onViewportChange);
    };
  }, [alwaysVisible]);

  const visible = alwaysVisible || scrollVisible || lingering || hovered || focused;

  return (
    <header className={styles.navbar} data-home={!alwaysVisible} data-visible={visible} data-scrolled={scrolled} aria-hidden={!visible} inert={!visible}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <nav aria-label="Navegación principal" className={styles.navbarContent}>
        <a className={styles.navbarBrand} href="https://funes.gob.ar/" aria-label="Ir al sitio de la Municipalidad de Funes">
          <Image src="/brand/funes-navbar-emblem.svg" alt="Municipalidad de Funes" width={225} height={235} />
          <span className={styles.navbarIdentity}><strong>Oficina de Empleo</strong><span>Municipalidad de Funes</span></span>
        </a>
        <div className={styles.navbarLinks}>
          {alwaysVisible ? <Link href="/" aria-current={homeCurrent}>Inicio</Link> : <a href="#contenido" aria-current={homeCurrent}>Inicio</a>}
          <Link href="/ofertas" aria-current={offersCurrent}>Ofertas</Link>
          {panel ? <Link href={panel.href} className={styles.navbarPanel} aria-current={panelCurrent}>Mi cuenta</Link>
            : !alwaysVisible && <a href="#contenido" className={styles.navbarPanel}>Ingresar</a>}
        </div>
      </nav>
    </header>
  );
}
