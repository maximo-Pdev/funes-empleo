"use client";
import { useActionState } from "react";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { Button, SelectField, TextField } from "@/components/ui";
import { createCourseReferralAction, saveCourseLinkAction } from "../actions";
import type { CourseLink } from "../service";

export function CourseLinkForm({ course }: { course?: CourseLink }) {
  const [state, action, pending] = useActionState(saveCourseLinkAction, {});
  const prefix = course ? `course-${course.id}` : "new-course";
  return <Form action={action} result={state} preserveOnSuccess={Boolean(course)} className="space-y-4">
    {course && <input type="hidden" name="courseId" value={course.id} />}
    <TextField id={`${prefix}-title`} label="Título del curso" name="title" required maxLength={200} defaultValue={course?.title} />
    <TextField id={`${prefix}-url`} label="Enlace oficial" name="url" type="url" required maxLength={2048} defaultValue={course?.url} hint="Usá HTTPS y verificá que sea el enlace oficial. El portal no comprueba ni descarga su contenido." />
    <Field label="Publicar enlace">
      <input id={`${prefix}-published`} type="checkbox" name="published" value="true" defaultChecked={course?.published ?? true} />
    </Field>
    <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar enlace"}</Button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </Form>;
}

export function CourseReferralForm({ candidateReference, courses }: { candidateReference: string; courses: CourseLink[] }) {
  const [state, action, pending] = useActionState(createCourseReferralAction, {});
  if (!courses.length) return <p>Publicá un curso para poder registrar una derivación.</p>;
  return <Form action={action} result={state} className="space-y-4">
    <input type="hidden" name="candidateReference" value={candidateReference} />
    <SelectField id="course-referral-course" label="Curso publicado" name="courseId" required options={courses.map(course => ({ value: course.id, label: course.title }))} />
    <p className="text-sm text-muted-foreground">Esta derivación es un antecedente municipal independiente de las postulaciones laborales. No inscribe al postulante en el curso.</p>
    <Button type="submit" disabled={pending}>{pending ? "Registrando…" : "Registrar derivación a curso"}</Button>
    {state.message && <p role={state.success ? "status" : "alert"}>{state.message}</p>}
  </Form>;
}
