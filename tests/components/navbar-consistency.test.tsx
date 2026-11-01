import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { PublicOffer } from "@/features/openings/public-service";

const mocks = vi.hoisted(() => ({ session: vi.fn(), pathname: "/ofertas" }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: vi.fn(async () => ({})) }));
vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname, notFound: vi.fn() }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), logoutAction: vi.fn() }));
vi.mock("@/features/notifications/components/notification-center", () => ({ NotificationCenter: () => <button aria-label="Notificaciones" /> }));
vi.mock("@/features/training/components/course-links", () => ({ CourseLinks: async () => <p>Sin cursos de prueba.</p> }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: vi.fn(async () => ({ total: 0, page: 1, pageSize: 10, items: [] })), listPublicOfferFilters: vi.fn(async () => ({ categories: [], localities: [], modalities: [] })), getPublicOffer: vi.fn() }));

import { getPublicOffer } from "@/features/openings/public-service";
import Offers from "@/app/(public)/ofertas/page";
import Detail from "@/app/(public)/ofertas/[openingId]/page";
import Courses from "@/app/(public)/cursos/page";
import Terms from "@/app/(public)/terminos/page";
import Recovery from "@/app/(auth)/recover/page";
import Expired from "@/app/(auth)/verification-expired/page";
import Logout from "@/app/(auth)/logout/page";
import Password from "@/app/(auth)/update-password/page";

const pages = [
  ["/ofertas", () => Offers({ searchParams: Promise.resolve({}) })],
  ["/ofertas/ejemplo", () => Detail({ params: Promise.resolve({ openingId: "ejemplo" }) })],
  ["/cursos", () => Courses()],
  ["/terminos", () => Terms()],
  ["/recover", () => Recovery()],
  ["/verification-expired", () => Expired()],
  ["/logout", () => Logout()],
  ["/update-password", () => Password()],
] as const;
afterEach(cleanup);

it.each([
  [null, null],
  ["candidate", "/dashboard"],
  ["company", "/empresa"],
  ["admin", "/admin"],
] as const)("keeps the same navigation across public and account lifecycle pages for %s", async (role, href) => {
  mocks.session.mockResolvedValue(role ? { account: { role, status: "active" } } : null);
  vi.mocked(getPublicOffer).mockResolvedValue({ id: "fictional-offer", slug: "ejemplo", title: "Oferta ficticia", company_name: "Empresa ficticia", tasks: "Tareas de prueba", requirements: "Requisitos de prueba", vacancies: 1, location: "Funes", modality: "onsite", schedule: "Diurno", contract_type: "fixed_term", closing_date: "2099-12-31", salary: null, benefits: null, categories: [] } satisfies PublicOffer);
  for (const [pathname, Page] of pages) {
    mocks.pathname = pathname;
    const view = render(await Page());
    const nav = within(screen.getByRole("navigation", { name: "Navegación principal" }));
    expect(screen.getAllByRole("navigation", { name: "Navegación principal" })).toHaveLength(1);
    expect(nav.getByRole("link", { name: "Inicio" }).getAttribute("href")).toBe("/");
    expect(nav.getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/ofertas");
    if (href) {
      expect(nav.getByRole("link", { name: "Mi cuenta" }).getAttribute("href")).toBe(href);
      expect(nav.getByRole("button", { name: "Notificaciones" })).toBeTruthy();
      expect(nav.queryByRole("link", { name: "Ingresar" })).toBeNull();
    } else {
      expect(nav.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/#contenido");
      expect(nav.queryByRole("link", { name: "Mi cuenta" })).toBeNull();
      expect(nav.queryByRole("button", { name: "Notificaciones" })).toBeNull();
    }
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    view.unmount();
  }
});
