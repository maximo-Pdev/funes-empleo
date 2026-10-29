import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const { list, save, refer } = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), refer: vi.fn() }));
vi.mock("@/features/training/service", () => ({ listCourseLinks: list }));
vi.mock("@/features/training/actions", () => ({ saveCourseLinkAction: save, createCourseReferralAction: refer }));
import { CourseLinks } from "@/features/training/components/course-links";
import { CourseLinkForm, CourseReferralForm } from "@/features/training/components/course-forms";
const course = { id: "22222222-2222-4222-8222-222222222222", title: "Curso municipal ficticio", url: "https://funes.gob.ar/curso", published: true };
beforeEach(() => { cleanup(); vi.clearAllMocks(); list.mockResolvedValue([]); save.mockResolvedValue({ success: true, message: "Enlace guardado." }); refer.mockResolvedValue({ success: true, message: "Derivación registrada." }); });
describe("course links and municipal referral forms", () => {
  it("shows an honest empty catalog without invented courses", async () => {
    render(await CourseLinks());
    expect(screen.getByText("No hay cursos publicados por el momento.")).toBeTruthy();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
  it("renders only supplied links with safe external navigation", async () => {
    list.mockResolvedValue([course]); render(await CourseLinks());
    const link = screen.getByRole("link", { name: course.title });
    expect(link.getAttribute("href")).toBe(course.url);
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText(/La información y las condiciones/)).toBeTruthy();
  });
  it("distinguishes unavailable data from an empty catalog", async () => {
    list.mockRejectedValue(new Error("private error")); render(await CourseLinks());
    expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar los cursos");
    expect(screen.queryByText(/No hay cursos publicados/)).toBeNull();
    expect(screen.queryByText("private error")).toBeNull();
  });
  it("validates required link fields before submitting", async () => {
    render(<CourseLinkForm />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar enlace" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Revisá");
  });
  it("sends entered metadata and an explicit publication flag", async () => {
    render(<CourseLinkForm />);
    fireEvent.change(screen.getByLabelText(/Título del curso/), { target: { value: course.title } });
    fireEvent.change(screen.getByLabelText(/Enlace oficial/), { target: { value: course.url } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar enlace" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    const data = save.mock.calls[0]![1] as FormData;
    expect(data.get("title")).toBe(course.title); expect(data.get("url")).toBe(course.url); expect(data.get("published")).toBe("true");
    expect(await screen.findByText("Enlace guardado.")).toBeTruthy();
  });
  it("refers only the selected opaque candidate without exposing a candidate directory", async () => {
    const reference = "can-" + "a".repeat(24);
    render(<CourseReferralForm candidateReference={reference} courses={[course]} />);
    fireEvent.change(screen.getByLabelText(/Curso publicado/), { target: { value: course.id } });
    fireEvent.click(screen.getByRole("button", { name: "Registrar derivación a curso" }));
    await waitFor(() => expect(refer).toHaveBeenCalled());
    const data = refer.mock.calls[0]![1] as FormData;
    expect(data.get("candidateReference")).toBe(reference); expect(data.get("courseId")).toBe(course.id);
    expect(screen.queryByRole("combobox", { name: /Candidato/ })).toBeNull();
    expect(await screen.findByText("Derivación registrada.")).toBeTruthy();
  });
  it("renders a publication edit with existing values", () => {
    render(<CourseLinkForm course={{ ...course, published: false }} />);
    expect((screen.getByLabelText(/Título del curso/) as HTMLInputElement).value).toBe(course.title);
    expect((screen.getByLabelText(/Publicar enlace/) as HTMLInputElement).checked).toBe(false);
  });
});
