import Link from "next/link";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { isRecordReference } from "@/lib/records/reference-format";
import { recordReferences } from "@/lib/records/references";
import { CourseLinkForm, CourseReferralForm } from "@/features/training/components/course-forms";
import { getCourseCandidate, getCourseReferralHistory, listCourseLinks, type CourseLink } from "@/features/training/service";

export const dynamic = "force-dynamic";
type SearchParams = Record<string, string | string[] | undefined>;

async function SelectedCandidate({ reference, page, courses }: { reference: string; page: number; courses: CourseLink[] | null }) {
  const data = await (async () => {
    const candidate = await getCourseCandidate(reference);
    const history = await getCourseReferralHistory(candidate.id, page);
    const actors = await recordReferences("account", history.items.map(item => item.referred_by));
    return { candidate, history, actors };
  })().catch(() => null);
  if (!data) return <p role="alert">No pudimos cargar el postulante o su historial. Revisá la referencia y volvé a intentar.</p>;
  const { candidate, history, actors } = data;
  const archived = candidate.archived_at !== null || candidate.status === "archived";
    const pageHref = (next: number) => `/admin/courses?candidate=${encodeURIComponent(reference)}&page=${next}`;
    return <section className="space-y-6" aria-label="Derivaciones a cursos del postulante">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">Postulante seleccionado</h2><p className="font-semibold">{candidate.display_name}</p>
        <Link className="inline-flex min-h-11 items-center underline" href={`/admin/candidates/${reference}`}>Volver al perfil del candidato</Link>
      </header>
      {archived ? <p>El perfil está archivado: solo se puede consultar su historial.</p> : courses && <CourseReferralForm candidateReference={reference} courses={courses.filter(course => course.published)} />}
      <section aria-label="Historial de derivaciones a cursos" className="space-y-4">
        <h3 className="text-lg font-semibold">Historial de derivaciones a cursos</h3>
        {history.items.length === 0 ? <p>{page === 1 ? "Sin derivaciones a cursos registradas." : "No hay derivaciones en esta página."}</p> : <ol className="space-y-4">
          {history.items.map(item => <li key={item.id} className="space-y-1 border-b border-border pb-4">
            <a href={item.course_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold underline">{item.course_title}</a>
            <p><time dateTime={item.referred_at}>{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Buenos_Aires", hour12: false }).format(new Date(item.referred_at))}</time></p>
            <p className="break-all text-sm text-muted-foreground">Cuenta responsable: {actors[item.referred_by]}</p>
          </li>)}
        </ol>}
        {(page > 1 || history.hasNext) && <nav aria-label="Páginas del historial de cursos" className="flex gap-6">
          {page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={pageHref(page - 1)}>Anterior</Link>}
          {history.hasNext && <Link className="inline-flex min-h-11 items-center underline" href={pageHref(page + 1)}>Siguiente</Link>}
        </nav>}
      </section>
    </section>;
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { user } = await requireActiveAccount(["admin"]);
  const query = await searchParams;
  const reference = query.candidate;
  const pageValue = query.page ?? "1";
  const valid = (reference === undefined || (typeof reference === "string" && isRecordReference("candidate", reference)))
    && typeof pageValue === "string" && /^[1-9][0-9]{0,4}$/.test(pageValue);
  let courses: CourseLink[] | null;
  try { courses = await listCourseLinks(true); } catch { courses = null; }
  const selected = valid && typeof reference === "string"
    ? await SelectedCandidate({ reference, page: Number(pageValue), courses }) : null;
  return <AdminShell email={user?.email} active="/admin/courses" title="Cursos y derivaciones" description="Enlaces oficiales y antecedentes de capacitación independientes de las postulaciones laborales.">
    <div className="grid gap-10 xl:grid-cols-2">
      <section aria-label="Enlaces municipales" className="min-w-0 space-y-6">
        <h2 className="text-xl font-semibold">Enlaces municipales</h2>
        {courses === null ? <p role="alert">No pudimos cargar los cursos. Volvé a intentar más tarde.</p> : <>
          <CourseLinkForm />
          {courses.length === 0 ? <p>Todavía no hay enlaces registrados.</p> : courses.map(course => <details key={course.id} className="border-b border-border pb-4">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold">{course.title} · {course.published ? "Publicado" : "Sin publicar"}</summary>
            <div className="pt-4"><CourseLinkForm course={course} /></div>
          </details>)}
        </>}
      </section>
      <div className="min-w-0">
        {!valid ? <p role="alert">Revisá la referencia del candidato y la página solicitada.</p> : selected ?? <section className="space-y-4">
          <h2 className="text-xl font-semibold">Registrar o consultar una derivación</h2>
          <p>Buscá al postulante y abrí Cursos desde su perfil. No hace falta una postulación laboral.</p>
          <Link className="inline-flex min-h-11 items-center underline" href="/admin/candidates">Buscar candidato</Link>
        </section>}
      </div>
    </div>
  </AdminShell>;
}
