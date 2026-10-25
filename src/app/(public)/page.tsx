import Link from "next/link";
import { HomeHero } from "./home-hero";
import { HomeNavbar } from "./home-navbar";
import { HomeOffersCarousel } from "./home-offers-carousel";
import { ArrowRight, Building2, ChevronDown, Clock, Mail, MapPin, Phone, Users } from "lucide-react";
import { getSiteAccess } from "@/features/accounts/navigation";
import { listPublicOffers, type PublicOffer } from "@/features/openings/public-service";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

async function getPreviewOffers(): Promise<PublicOffer[]> {
  try {
    return (await listPublicOffers({ page: 1, pageSize: 12 })).items;
  } catch {
    return [];
  }
}

const processSteps = [
  "La empresa envía una búsqueda para revisión municipal.",
  "La Oficina publica la oferta y evalúa postulantes.",
  "Solo los perfiles derivados se comparten con la empresa.",
];

const roleCards = [
  { icon: Users, title: "Postulantes", description: "Completá tu perfil, cargá tu CV y postulá a búsquedas aprobadas por la Oficina de Empleo.", href: "/registro/candidato", linkLabel: "Crear cuenta de postulante" },
  { icon: Building2, title: "Empresas", description: "Registrá tu empresa, prepará ofertas y recibí perfiles solo cuando exista una derivación municipal.", href: "/registro/empresa", linkLabel: "Registrar empresa" },
];

const faqs = [
  { q: "¿Necesito una cuenta para ver las ofertas?", a: "No. Todas las búsquedas vigentes son públicas y podés consultarlas sin registrarte. La cuenta es necesaria para postularte, cargar tu CV o publicar búsquedas." },
  { q: "¿Quién puede ver mi CV?", a: "Solo vos, la Oficina de Empleo y las empresas a las que la Oficina decida derivarte para una oferta concreta. Las empresas no navegan el padrón de candidatos." },
  { q: "¿Cómo llega mi perfil a una empresa?", a: "Te postulás a una oferta, la Oficina revisa tu perfil y, si te preselecciona, lo comparte con esa empresa. Toda derivación pasa antes por la Oficina." },
  { q: "¿Puedo hacer el trámite de forma presencial?", a: "Sí. La Oficina de Empleo también puede ayudarte en persona a completar tu perfil y a postularte a las búsquedas." },
  { q: "¿Quién aprueba las ofertas que se publican?", a: "Cada búsqueda que envía una empresa pasa por revisión municipal antes de publicarse. Solo se muestran ofertas aprobadas." },
];

export default async function HomePage() {
  const [{ panel }, offers] = await Promise.all([getSiteAccess(), getPreviewOffers()]);
  return (
    <>
      <HomeNavbar panel={panel} />
      <main id="contenido" tabIndex={-1} className={styles.page}>
        <HomeHero authenticated={panel !== null} panelHref={panel?.href} panelLabel={panel ? `Ir al ${panel.label.toLowerCase()}` : undefined} />
        <section id="ofertas-disponibles" tabIndex={-1} className={styles.information} aria-labelledby="ofertas-titulo">
          <div className={styles.offersSection}>
            <div className={styles.offersHeader}>
              <div>
                <h2 id="ofertas-titulo" className={styles.offersTitle}>Ofertas disponibles</h2>
                <p className={styles.offersSubtitle}>Explorá una selección de las búsquedas vigentes aprobadas por la Oficina de Empleo.</p>
              </div>
              <Link href="/ofertas" className={styles.offersAllLink}>Ver todas las ofertas<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
            {offers.length > 0 ? (
              <HomeOffersCarousel offers={offers} />
            ) : (
              <div className={styles.offersEmpty}>
                <p>No hay ofertas vigentes para mostrar en este momento.</p>
                <p>Cuando la Oficina apruebe nuevas búsquedas, van a aparecer acá.</p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.processSection} aria-labelledby="process-title">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Cómo trabaja la Oficina</p>
            <h2 id="process-title" className={styles.sectionTitle}>Simple para usar, cuidadoso con los datos.</h2>
            <p className={styles.sectionLead}>Cada búsqueda y cada derivación pasan por la Oficina de Empleo, que actúa como intermediaria entre candidatos y empresas.</p>
            <ol className={styles.processSteps}>
              {processSteps.map((step, index) => (
                <li key={step} className={styles.processStep}>
                  <span className={styles.processStepNumber} aria-hidden="true">{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.rolesSection} aria-labelledby="roles-title">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Guía por rol</p>
            <h2 id="roles-title" className={styles.sectionTitle}>Cada perfil entra por el camino correcto</h2>
            <div className={styles.roleCards}>
              {roleCards.map(card => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className={styles.roleCard}>
                    <span className={styles.roleCardIcon} aria-hidden="true"><Icon size={24} /></span>
                    <h3 className={styles.roleCardTitle}>{card.title}</h3>
                    <p className={styles.roleCardDescription}>{card.description}</p>
                    <Link href={card.href} className={styles.roleCardLink}>{card.linkLabel}<ArrowRight size={16} aria-hidden="true" /></Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-title">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Preguntas frecuentes</p>
            <h2 id="faq-title" className={styles.sectionTitle}>Lo que más nos preguntan</h2>
            <div className={styles.faqList}>
              {faqs.map(faq => (
                <details key={faq.q} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{faq.q}<ChevronDown size={20} aria-hidden="true" /></summary>
                  <p className={styles.faqAnswer}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.closingSection} aria-labelledby="closing-title">
          <div className={styles.sectionInner}>
            <div className={styles.closingGrid}>
              <div>
                <h2 id="closing-title" className={styles.closingTitle}>¿Listo para dar el siguiente paso?</h2>
                <p className={styles.closingLead}>Creá tu cuenta y empezá a usar el portal, o acercate a la Oficina de Empleo para que te acompañemos en el proceso.</p>
                <div className={styles.closingActions}>
                  <Link href="/registro/candidato" className={styles.closingPrimary}>Registrarme como postulante<ArrowRight size={16} aria-hidden="true" /></Link>
                  <Link href="/registro/empresa" className={styles.closingSecondary}>Registrar empresa</Link>
                </div>
              </div>
              <div className={styles.closingContact}>
                <p className={styles.closingContactTitle}>Oficina de Empleo</p>
                <p className={styles.closingContactSub}>Municipalidad de Funes</p>
                <ul className={styles.contactList}>
                  <li><MapPin size={18} aria-hidden="true" /><span>[Dirección de la Oficina de Empleo]</span></li>
                  <li><Clock size={18} aria-hidden="true" /><span>[Horarios de atención]</span></li>
                  <li><Phone size={18} aria-hidden="true" /><span>[Teléfono de contacto]</span></li>
                  <li><Mail size={18} aria-hidden="true" /><span>[Correo de contacto]</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
