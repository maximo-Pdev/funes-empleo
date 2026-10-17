import { beforeEach, expect, it, vi } from "vitest";

const { rpc, createClient } = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: createClient }));
import { getPublicOffer, listPublicOffers } from "@/features/openings/public-service";

const offer = {
  id: "00000000-0000-4000-8000-000000000001", slug: "auxiliar-ficticio-0123456789abcdef",
  company_name: "Empresa ficticia", title: "Auxiliar ficticio", tasks: "Tareas", requirements: "Requisitos",
  vacancies: 1, location: "Funes", modality: "onsite", schedule: "Completo", contract_type: "fixed_term",
  closing_date: "2099-12-31", salary: null, benefits: null, categories: [],
};
const response = { total: 1, page: 1, pageSize: 1, items: [offer] };
beforeEach(() => {
  vi.clearAllMocks();
  createClient.mockResolvedValue({ rpc });
  rpc.mockResolvedValue({ data: response, error: null });
});

it("resuelve slug por RPC sin convertirlo en UUID ni consultar tablas", async () => {
  await expect(getPublicOffer(offer.slug)).resolves.toEqual(offer);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("published_offer_by_slug", { p_slug: offer.slug });
});
it("conserva consulta UUID antigua para compatibilidad", async () => {
  await expect(getPublicOffer(offer.id)).resolves.toEqual(offer);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("published_offers", { p_page: 1, p_page_size: 1, p_id: offer.id });
});
it.each(["", "slug", "../oferta-0123456789abcdef", "oferta-0123456789abcdeg", "oferta-0123456789ABCDEF",
  "oferta-0123456789abcdef?x=1", "oferta-0123456789abcdef/extra", "a".repeat(65) + "-0123456789abcdef"])("rechaza referencia inválida sin consultar: %s", async reference => {
  await expect(getPublicOffer(reference)).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(createClient).not.toHaveBeenCalled();
});
it("slug no público e inexistente preservan NOT_FOUND", async () => {
  rpc.mockResolvedValue({ data: { ...response, total: 0, items: [] }, error: null });
  await expect(getPublicOffer(offer.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("no convierte errores de infraestructura en oferta ausente", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "Fallo ficticio" } });
  await expect(getPublicOffer(offer.slug)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it("valida el slug de la respuesta de listado y detalle", async () => {
  rpc.mockResolvedValue({ data: { ...response, items: [{ ...offer, slug: "invalido" }] }, error: null });
  await expect(getPublicOffer(offer.id)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  await expect(listPublicOffers({ page: 1 })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
