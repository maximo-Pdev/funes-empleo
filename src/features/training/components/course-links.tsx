import { listCourseLinks } from "../service";
import { BoundedList } from "@/components/ui/bounded-list";

/** Public metadata only. Safe to embed directly in the candidate Cursos section. */
export async function CourseLinks() {
  let courses;
  try { courses = await listCourseLinks(); }
  catch { return <p role="alert">No pudimos cargar los cursos. Volvé a intentar más tarde.</p>; }
  return <section aria-label="Cursos municipales" className="space-y-4">
    <h2 className="font-heading text-xl font-semibold">Cursos municipales</h2>
    <p className="text-sm text-muted-foreground">La información y las condiciones de cada curso se consultan en su enlace oficial. Este portal no gestiona inscripciones.</p>
    {courses.length === 0 ? <p>No hay cursos publicados por el momento.</p> : <BoundedList mode="pages" label="Cursos municipales" className="space-y-3">
      {courses.map(course => <li key={course.id}>
        <a href={course.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-brand-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">{course.title}</a>
      </li>)}
    </BoundedList>}
  </section>;
}
