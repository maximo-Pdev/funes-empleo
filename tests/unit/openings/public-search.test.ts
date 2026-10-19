import { beforeEach, expect, it, vi } from "vitest";
const { rpc, createClient } = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: createClient }));
import { listPublicOffers, listPublicOfferFilters } from "@/features/openings/public-service";

beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockResolvedValue({ rpc });
  rpc.mockResolvedValue({ data: { total: 0, page: 2, pageSize: 10, items: [] }, error: null });
});
it("transporta los cuatro filtros normalizados antes de paginar", async () => {
  await listPublicOffers({ q: "  depósito  ", rubro: " ADMIN ", localidad: " Funes ", modalidad: " onsite ", page: "2" });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("search_published_offers", {
    p_q: "depósito", p_rubro: "ADMIN", p_localidad: "funes", p_modalidad: "onsite", p_page: 2, p_page_size: 10,
  });
});
it("vacíos conservan RPC y contrato anterior", async () => {
  await listPublicOffers({ q: " ", rubro: "", localidad: "", modalidad: "" });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("published_offers", { p_page: 1, p_page_size: 10 });
});
it.each([{ q: "x".repeat(121) }, { rubro: "x".repeat(51) }, { localidad: "x".repeat(201) },
  { modalidad: "x".repeat(101) }, { q: ["a", "b"] }, { rubro: ["a"] }, { page: "0" }, { page: "1.5" },
  { page: ["1"] }, { page: true }, { pageSize: 31 }])("rechaza entrada inválida sin consulta: %j", async input => {
  await expect(listPublicOffers(input)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  expect(createClient).not.toHaveBeenCalled();
});
it("no interpreta comodines ni sintaxis SQL en el transporte", async () => {
  await listPublicOffers({ q: "%_' OR 1=1 --" });
  expect(rpc).toHaveBeenCalledWith("search_published_offers", expect.objectContaining({ p_q: "%_' OR 1=1 --" }));
});
it("obtiene solo la proyección de opciones y valida la respuesta", async () => {
  const options = { categories: [{ value: "ADMIN", label: "Administración" }], localities: [{ value: "funes", label: "Funes" }], modalities: [{ value: "onsite", label: "onsite" }] };
  rpc.mockResolvedValue({ data: options, error: null });
  await expect(listPublicOfferFilters()).resolves.toEqual(options);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("public_offer_filter_options");
  rpc.mockResolvedValue({ data: { categories: [{ value: "ADMIN" }] }, error: null });
  await expect(listPublicOfferFilters()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it("propaga fallo técnico de opciones sin mostrar respuesta DB", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "SQL ficticio" } });
  await expect(listPublicOfferFilters()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
