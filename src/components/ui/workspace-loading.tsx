import { Skeleton } from "@/components/ui/skeleton";
import account from "@/app/(auth)/account/account.module.css";
import home from "@/app/(public)/home.module.css";
import publicOffers from "@/app/(public)/ofertas/public-offers.module.css";
import styles from "./workspace-loading.module.css";

function PlaceholderContent() {
  return <div className={styles.content} aria-hidden="true">
    <Skeleton className={styles.title} />
    <Skeleton className={styles.line} />
    <div className={styles.rows}>{[0, 1, 2].map(item => <div key={item} className={styles.row}>
      <Skeleton className={styles.line} /><Skeleton className={styles.shortLine} />
    </div>)}</div>
  </div>;
}

/** Loading geometry only: no assumed identity, role links or private reads. */
export function WorkspaceLoading({ title = "Cargando tu espacio…" }: { title?: string }) {
  return <div className={`${account.page} ${styles.loading}`} data-loading-layout="workspace">
    <div className={styles.header} aria-hidden="true"><Skeleton className={styles.emblem} /><Skeleton className={styles.headerLine} /></div>
    <div className={account.workspace}>
      <div className={`${account.sidebar} ${styles.sidebar}`} data-loading-part="sidebar" aria-hidden="true">
        <div className={styles.sidebarLinks}>{[0, 1, 2, 3, 4].map(item => <Skeleton key={item} className={styles.navItem} />)}</div>
        <div className={styles.identity}><Skeleton className={styles.emblem} /><Skeleton className={styles.shortLine} /></div>
      </div>
      <main id="contenido" tabIndex={-1} aria-busy="true" className={`${account.main} ${account.candidateWorkspace}`}>
        <div className={account.candidateCanvas} data-loading-part="canvas">
          <div className={account.sectionContent}><h1 className="sr-only">{title}</h1><p role="status" className={styles.status}>{title}</p><PlaceholderContent /></div>
        </div>
      </main>
    </div>
  </div>;
}

export function HomeLoading() {
  return <main id="contenido" tabIndex={-1} aria-busy="true" className={`${home.page} ${styles.homePage} ${styles.loading}`} data-loading-layout="home">
    <h1 className="sr-only">Cargando portal de empleo</h1>
    <div className={home.hero}>
      <div className={`${home.brand} ${styles.homeBrand}`} data-loading-part="introduction"><div className={home.introduction}><PlaceholderContent /></div></div>
      <div className={home.access} data-loading-part="access"><div className={styles.accessCard}>
        <p role="status" className={styles.status}>Cargando portal de empleo…</p><PlaceholderContent />
      </div></div>
    </div>
  </main>;
}

export function PageLoading({ offerDetail = false }: { offerDetail?: boolean } = {}) {
  if (offerDetail) return <div className={styles.loading} data-loading-layout="public-detail">
    <div className={styles.header} aria-hidden="true"><Skeleton className={styles.emblem} /><Skeleton className={styles.headerLine} /></div>
    <main id="contenido" tabIndex={-1} aria-busy="true" className="min-h-screen bg-brand-primary px-4 pb-8 pt-24 text-foreground sm:px-6">
      <div className={account.candidateCanvas} style={{ maxWidth: 1280 }} data-loading-part="canvas">
        <div className={account.sectionContent}><h1 className="sr-only">Cargando oferta</h1><p role="status" className={styles.status}>Cargando oferta…</p><PlaceholderContent /></div>
      </div>
    </main>
  </div>;
  return <div className={`${publicOffers.page} ${styles.loading}`} data-loading-layout="public">
    <div className={styles.header} aria-hidden="true"><Skeleton className={styles.emblem} /><Skeleton className={styles.headerLine} /></div>
    <main id="contenido" tabIndex={-1} aria-busy="true" className={publicOffers.main}>
      <div className={publicOffers.canvas}><h1 className="sr-only">Cargando página</h1><p role="status" className={styles.status}>Cargando página…</p><PlaceholderContent /></div>
    </main>
  </div>;
}
