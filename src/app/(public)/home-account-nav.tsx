import Link from "next/link";
import styles from "./home.module.css";

export function HomeAccountNav({ href, label }: { href: string; label: string }) {
  return <nav aria-label="Accesos principales" className={styles.accountNav}>
    <Link href="/ofertas">Ofertas</Link>
    <Link href={href}>{label}</Link>
  </nav>;
}
