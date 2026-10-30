import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const { guard, links, candidate, history, site, references } = vi.hoisted(() => ({ guard: vi.fn(), links: vi.fn(), candidate: vi.fn(), history: vi.fn(), site: vi.fn(), references: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: guard }));
vi.mock("@/features/training/service", () => ({ listCourseLinks: links, getCourseCandidate: candidate, getCourseReferralHistory: history }));
vi.mock("@/features/accounts/navigation", () => ({ getSiteAccess: site }));
vi.mock("@/lib/records/references", () => ({ recordReferences: references }));
vi.mock("@/app/(public)/home-navbar", () => ({ HomeNavbar: ({ panel }: { panel?: { label: string } }) => <nav>{panel?.label}</nav> }));
vi.mock("@/app/(admin)/_components/admin-shell", () => ({ AdminShell: ({ title, children }: { title: string; children: ReactNode }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock("@/features/training/actions", () => ({ saveCourseLinkAction: vi.fn(), createCourseReferralAction: vi.fn() }));
import AdminCoursesPage from "@/app/(admin)/admin/courses/page";
import PublicCoursesPage from "@/app/(public)/cursos/page";
const ref = "can-" + "a".repeat(24);
beforeEach(() => {
  cleanup(); vi.clearAllMocks();
  guard.mockResolvedValue({ user: { email: "admin@example.test" } }); links.mockResolvedValue([]);
  site.mockResolvedValue({ panel: { href: "/dashboard", label: "Panel de usuario" } });
  candidate.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", display_name: "Postulante ficticio", status: "active", archived_at: null });
  history.mockResolvedValue({ items: [], hasNext: false }); references.mockResolvedValue({});
});
describe("course routes", () => {
  it("uses the verified site entry on the public course catalog", async () => {
    render(await PublicCoursesPage());
    expect(screen.getByRole("heading", { level: 1, name: "Capacitación municipal" })).toBeTruthy();
    expect(screen.getByText("Panel de usuario")).toBeTruthy(); expect(guard).not.toHaveBeenCalled();
  });
  it("guards administrator access before reading private data", async () => {
    guard.mockRejectedValue(new Error("redirect"));
    await expect(AdminCoursesPage({ searchParams: Promise.resolve({ candidate: ref }) })).rejects.toThrow("redirect");
    expect(candidate).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled(); expect(links).not.toHaveBeenCalled();
  });
  it("requires selection from the existing candidate search, not a directory select", async () => {
    render(await AdminCoursesPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("link", { name: "Buscar candidato" }).getAttribute("href")).toBe("/admin/candidates");
    expect(candidate).not.toHaveBeenCalled(); expect(history).not.toHaveBeenCalled();
  });
  it("loads the selected opaque candidate and independent history", async () => {
    render(await AdminCoursesPage({ searchParams: Promise.resolve({ candidate: ref }) }));
    expect(candidate).toHaveBeenCalledWith(ref); expect(history).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", 1);
    expect(screen.getByText("Postulante ficticio")).toBeTruthy(); expect(screen.getByText("Sin derivaciones a cursos registradas.")).toBeTruthy();
  });
  it("preserves history but disables creation for an archived candidate", async () => {
    candidate.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111", display_name: "Postulante ficticio", archived_at: "2026-10-01", status: "archived" });
    render(await AdminCoursesPage({ searchParams: Promise.resolve({ candidate: ref }) }));
    expect(screen.getByText(/El perfil está archivado/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Registrar derivación a curso" })).toBeNull(); expect(history).toHaveBeenCalled();
  });
  it("rejects raw candidate IDs without exposing them or invoking resolution", async () => {
    render(await AdminCoursesPage({ searchParams: Promise.resolve({ candidate: "11111111-1111-4111-8111-111111111111" }) }));
    expect(screen.getByRole("alert").textContent).toContain("referencia"); expect(candidate).not.toHaveBeenCalled();
  });
  it("keeps catalog failures distinct from empty metadata", async () => {
    links.mockRejectedValue(new Error("private SQL"));
    render(await AdminCoursesPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar");
    expect(screen.queryByText("private SQL")).toBeNull(); expect(screen.queryByText("Todavía no hay enlaces registrados.")).toBeNull();
  });
  it("paginates history with opaque candidate context and identifies staff attribution", async () => {
    history.mockResolvedValue({ items: [{ id: "row", course_title: "Curso anterior", course_url: "https://funes.gob.ar/anterior", referred_at: "2026-10-27T15:00:00Z", referred_by: "staff" }], hasNext: true });
    references.mockResolvedValue({ staff: "cta-" + "b".repeat(24) });
    render(await AdminCoursesPage({ searchParams: Promise.resolve({ candidate: ref, page: "2" }) }));
    expect(history).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111", 2);
    expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toContain(`candidate=${ref}&page=3`);
    expect(screen.getByText(/cta-b/)).toBeTruthy(); expect(screen.getByRole("link", { name: "Curso anterior" })).toBeTruthy();
  });
});
