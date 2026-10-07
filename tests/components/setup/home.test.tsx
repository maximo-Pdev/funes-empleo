import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { PublicOffer } from "@/features/openings/public-service";

const { listPublicOffers } = vi.hoisted(() => ({
  listPublicOffers: vi.fn<typeof import("@/features/openings/public-service").listPublicOffers>(),
}));

vi.mock("@/features/openings/public-service", () => ({ listPublicOffers }));

import HomePage from "@/app/(public)/page";

const offers: PublicOffer[] = [
  "Auxiliar de depósito ficticio",
  "Asistente administrativo ficticio",
  "Operario de mantenimiento ficticio",
].map((title, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  company_name: `Empresa ficticia ${index + 1}`,
  title,
  tasks: "Organizar las tareas del sector de demostración.",
  requirements: "Experiencia en tareas similares.",
  vacancies: index + 1,
  location: "Funes",
  modality: "onsite",
  schedule: "Lunes a viernes de 8 a 16",
  contract_type: "fixed_term",
  closing_date: "2099-12-31",
  salary: null,
  benefits: null,
  categories: [{ id: "00000000-0000-4000-8000-000000000010", name: "Categoría ficticia" }],
}));

beforeEach(() => {
  listPublicOffers.mockReset();
});

function expectPreviewRequest() {
  expect(listPublicOffers).toHaveBeenCalledExactlyOnceWith({ page: 1, pageSize: 3 });
}

it("permite saltar la navegación hacia un main enfocable con el registro como primer enlace", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 3, items: [] });
  const { container } = render(await HomePage());

  const main = screen.getByRole("main");
  const header = screen.getByRole("banner");
  expect(main.id).toBe("contenido");
  expect(main.contains(header)).toBe(false);
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(header.parentElement).toBe(main.parentElement);
  expect(screen.getByRole("contentinfo").parentElement).toBe(main.parentElement);
  expect(within(main).getAllByRole("link")[0]?.getAttribute("href")).toBe("/registro/candidato");
  expect(container.querySelectorAll("#contenido")).toHaveLength(1);
});

it("mantiene objetivos táctiles locales de 44px en los accesos del header", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 3, items: [] });
  render(await HomePage());

  const navigation = screen.getByRole("navigation", { name: "Accesos principales" });
  for (const name of ["Ofertas", "Iniciar sesión"]) {
    const link = within(navigation).getByRole("link", { name });
    expect(link.classList.contains("min-h-11")).toBe(true);
    expect(link.classList.contains("inline-flex")).toBe(true);
    expect(link.classList.contains("items-center")).toBe(true);
  }
});

it("muestra tres ofertas públicas con títulos y enlaces sin campos privados", async () => {
  listPublicOffers.mockResolvedValue({ total: 10, page: 1, pageSize: 3, items: offers });

  const { container } = render(await HomePage());

  expectPreviewRequest();
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
    "Un puente claro entre personas que buscan trabajo y empresas de Funes.",
  );
  expect(screen.getByRole("heading", { name: "Intermediación municipal protegida", level: 2 })).toBeTruthy();
  expect(screen.getAllByText(/datos ficticios/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Las empresas no ven el padrón completo/)).toBeTruthy();
  const preview = screen.getByRole("region", { name: "Búsquedas aprobadas por la Oficina de Empleo" });
  expect(within(preview).getAllByRole("listitem")).toHaveLength(3);
  for (const offer of offers) {
    expect(within(preview).getByRole("link", { name: offer.title }).getAttribute("href")).toBe(`/ofertas/${offer.id}`);
    expect(within(preview).getByText(offer.company_name)).toBeTruthy();
  }
  expect(within(preview).getAllByText("Funes · Presencial")).toHaveLength(3);
  const dates = preview.querySelectorAll("time");
  expect(dates).toHaveLength(3);
  for (const date of dates) {
    expect(date.textContent).toBe("31/12/2099");
    expect(date.getAttribute("datetime")).toBe("2099-12-31");
  }
  expect(within(preview).getByRole("link", { name: "Ver todas" }).getAttribute("href")).toBe("/ofertas");
  expect(container.textContent).not.toMatch(/CUIT|DNI|responsable|contactos privados|notas internas|resultados individuales/i);
  expect(container.querySelector('a[href^="mailto:"], a[href^="tel:"]')).toBeNull();
  expect(screen.queryByText("No hay ofertas vigentes para mostrar.")).toBeNull();
  expect(screen.queryByText("No pudimos cargar las ofertas en este momento.")).toBeNull();
});

it("muestra un estado vacío sin simular ofertas", async () => {
  listPublicOffers.mockResolvedValue({ total: 0, page: 1, pageSize: 3, items: [] });

  render(await HomePage());

  expectPreviewRequest();
  const preview = screen.getByRole("region", { name: "Búsquedas aprobadas por la Oficina de Empleo" });
  expect(within(preview).getByText("No hay ofertas vigentes para mostrar.")).toBeTruthy();
  expect(within(preview).queryByRole("list")).toBeNull();
  expect(screen.queryByText("No pudimos cargar las ofertas en este momento.")).toBeNull();
});

it("ante un rechazo muestra un mensaje seguro y mantiene registro e ingreso", async () => {
  const rawError = "Detalle interno ficticio: published_offers falló en la conexión de prueba";
  listPublicOffers.mockRejectedValue(new Error(rawError));

  const { container } = render(await HomePage());

  expectPreviewRequest();
  expect(screen.getByText("No pudimos cargar las ofertas en este momento.")).toBeTruthy();
  expect(screen.getByText("Podés entrar al listado completo o volver a intentarlo más tarde.")).toBeTruthy();
  expect(screen.queryByText("No hay ofertas vigentes para mostrar.")).toBeNull();
  expect(container.textContent).not.toContain(rawError);
  expect(container.textContent).not.toMatch(/published_offers|Error:|stack/i);
  expect(screen.getByRole("link", { name: "Registrarme como postulante" }).getAttribute("href")).toBe("/registro/candidato");
  for (const link of screen.getAllByRole("link", { name: "Registrar empresa" })) {
    expect(link.getAttribute("href")).toBe("/registro/empresa");
  }
  expect(screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")).toBe("/login");
  const preview = screen.getByRole("region", { name: "Búsquedas aprobadas por la Oficina de Empleo" });
  expect(within(preview).queryByRole("list")).toBeNull();
  expect(within(preview).getByRole("link", { name: "Ver todas" }).getAttribute("href")).toBe("/ofertas");
});
