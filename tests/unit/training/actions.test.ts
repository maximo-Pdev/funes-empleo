import { beforeEach, describe, expect, it, vi } from "vitest";
const { save, refer, revalidate } = vi.hoisted(() => ({ save: vi.fn(), refer: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/training/service", () => ({ saveCourseLink: save, createCourseReferral: refer }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
import { saveCourseLinkAction, createCourseReferralAction } from "@/features/training/actions";
import { AppError } from "@/lib/errors/public-error";
beforeEach(() => { vi.clearAllMocks(); save.mockResolvedValue(undefined); refer.mockResolvedValue(undefined); });
describe("training server actions", () => {
  it("forwards explicit unpublished state and refreshes link consumers", async () => {
    const form = new FormData(); form.set("title", "Curso"); form.set("url", "https://funes.gob.ar/curso");
    expect((await saveCourseLinkAction({}, form)).success).toBe(true);
    expect(save).toHaveBeenCalledWith({ title: "Curso", url: "https://funes.gob.ar/curso", published: false, courseId: undefined });
    expect(revalidate).toHaveBeenCalledWith("/cursos"); expect(revalidate).toHaveBeenCalledWith("/admin/courses");
  });
  it("forwards only selected candidate/course, never an application", async () => {
    const form = new FormData(); form.set("candidateReference", "can-" + "a".repeat(24)); form.set("courseId", "22222222-2222-4222-8222-222222222222");
    expect((await createCourseReferralAction({}, form)).success).toBe(true);
    expect(refer).toHaveBeenCalledWith({ candidateReference: form.get("candidateReference"), courseId: form.get("courseId") });
    expect(revalidate).toHaveBeenCalledWith("/admin/courses");
  });
  it("returns safe failure feedback without success revalidation", async () => {
    refer.mockRejectedValue(new AppError("ACCESS_DENIED"));
    const result = await createCourseReferralAction({}, new FormData());
    expect(result.success).toBe(false); expect(result.message).toBeTruthy(); expect(revalidate).not.toHaveBeenCalled();
  });
});
