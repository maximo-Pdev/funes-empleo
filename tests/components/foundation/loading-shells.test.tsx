import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import PublicLoading from "@/app/(public)/loading";
import AccountLoading from "@/app/(auth)/account/loading";
import DashboardLoading from "@/app/(auth)/dashboard/loading";
import CompanyLoading from "@/app/(company)/empresa/loading";
import CandidateLoading from "@/app/(candidate)/candidato/loading";
import AdminLoading from "@/app/(admin)/admin/loading";
import accountStyles from "@/app/(auth)/account/account.module.css";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }));
afterEach(() => { cleanup(); vi.mocked(usePathname).mockReturnValue("/"); });

describe("session-neutral loading boundaries", () => {
  it("matches the public offer detail's shared canvas and explicit 1280px cap", () => {
    vi.mocked(usePathname).mockReturnValue("/ofertas/oferta-ficticia");
    const { container } = render(<PublicLoading />);
    const canvas = container.querySelector<HTMLElement>('[data-loading-part="canvas"]');
    expect(canvas?.className.split(" ")).toContain(accountStyles.candidateCanvas);
    expect(canvas?.style.maxWidth).toBe("1280px");
    expect(canvas?.querySelector(`.${accountStyles.sectionContent}`)).not.toBeNull();
    expect(container.querySelector('[data-loading-part="sidebar"]')).toBeNull();
  });
  it.each(["/ofertas", "/ofertas/oferta-ficticia"])("keeps public inner pages out of the Home access quadrants (%s)", pathname => {
    vi.mocked(usePathname).mockReturnValue(pathname);
    const { container } = render(<PublicLoading />);
    expect(container.querySelector('[data-loading-layout="home"]')).toBeNull();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(container.querySelector("form, a, button")).toBeNull();
  });
  it("matches Home introduction and access quadrants without assuming a login state", () => {
    const { container } = render(<PublicLoading />);
    expect(container.querySelector('[data-loading-layout="home"]')).not.toBeNull();
    expect(container.querySelector('[data-loading-part="introduction"]')).not.toBeNull();
    expect(container.querySelector('[data-loading-part="access"]')).not.toBeNull();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelector("form, a, button")).toBeNull();
  });
  it.each([CandidateLoading, AdminLoading, AccountLoading, DashboardLoading, CompanyLoading])("uses the current sidebar and white canvas without private identity or interactive session chrome", Loading => {
    const { container } = render(<Loading />);
    expect(container.querySelector('[data-loading-layout="workspace"]')).not.toBeNull();
    expect(container.querySelector('[data-loading-part="sidebar"]')).not.toBeNull();
    expect(container.querySelector('[data-loading-part="canvas"]')).not.toBeNull();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("form, a, button")).toBeNull();
    expect(container.textContent).not.toMatch(/Correo no disponible|Administración|Cerrar sesión/);
  });

});
