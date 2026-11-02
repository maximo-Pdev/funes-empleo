import { HomeNavbar } from "@/app/(public)/home-navbar";
import { getSiteAccess } from "@/features/accounts/navigation";
import { CourseLinks } from "@/features/training/components/course-links";

export const dynamic = "force-dynamic";
export default async function PublicCoursesPage() {
  const access = await getSiteAccess();
  const links = await CourseLinks();
  return <>
    <HomeNavbar alwaysVisible panel={access.panel} />
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-page pt-16 text-foreground">
      <header className="bg-brand-primary text-white">
        <div className="mx-auto max-w-[var(--layout-content-max)] space-y-4 px-5 py-12 sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-wide">Oficina de Empleo · Municipalidad de Funes</p>
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">Capacitación municipal</h1>
          <p>Consultá los enlaces a cursos publicados por la Oficina de Empleo.</p>
        </div>
      </header>
      <div className="mx-auto max-w-[var(--layout-content-max)] px-5 py-10 sm:px-10">{links}</div>
    </main>
  </>;
}
