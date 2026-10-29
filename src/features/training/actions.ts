"use server";
import { revalidatePath } from "next/cache";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { createCourseReferral, saveCourseLink } from "./service";

export type TrainingActionState = { success?: boolean; message?: string };
export async function saveCourseLinkAction(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  try {
    await saveCourseLink({ title: form.get("title"), url: form.get("url"), published: form.get("published") === "true", courseId: form.get("courseId") || undefined });
    for (const path of ["/cursos", "/admin/courses", "/dashboard", "/account"]) revalidatePath(path);
    return { success: true, message: "Enlace guardado." };
  } catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
export async function createCourseReferralAction(_previous: TrainingActionState, form: FormData): Promise<TrainingActionState> {
  try {
    await createCourseReferral({ candidateReference: form.get("candidateReference"), courseId: form.get("courseId") });
    revalidatePath("/admin/courses");
    return { success: true, message: "Derivación registrada." };
  } catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
