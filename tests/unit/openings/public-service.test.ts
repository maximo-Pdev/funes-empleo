import { beforeEach, expect, it, vi } from "vitest";

const { rpc, createClient } = vi.hoisted(() => ({ rpc: vi.fn(), createClient: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: createClient }));
import { getPublicOffer, listPublicOffers } from "@/features/openings/public-service";

const offer = {
  id: "00000000-0000-4000-8000-000000000001", slug: "auxiliar-original-a1b2c3d4e5f6",
  title: "Título actualizado", company_name: "Empresa ficticia", tasks: "Tareas", requirements: "Requisitos",
  vacancies: 1, location: "Funes", modality: "onsite", schedule: "Completo", contract_type: "fixed_term",
  closing_date: "2099-12-31", salary: null, benefits: null, categories: [],
};
const response = (items = [offer]) => ({ total: items.length, page: 1, pageSize: 1, items });
beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockResolvedValue({ rpc });
  rpc.mockResolvedValue({ data: response(), error: null });
});

it.each(["", offer.id, "auxiliar-sin-sufijo", "../auxiliar-a1b2c3d4e5f6", "auxiliar-a1b2c3d4e5f6/otro", "auxiliar%2fa1b2c3d4e5f6", "auxiliar-a1b2c3d4e5f6?x=1", "auxiliar-a1b2c3d4e5f6#otro", " auxiliary-a1b2c3d4e5f6", "Áuxiliar-a1b2c3d4e5f6", "a".repeat(251)])("rechaza identificadores inválidos sin consultar la base (%s)", async (slug) => {
  await expect(getPublicOffer(slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(createClient).not.toHaveBeenCalled();
});
it("devuelve NOT_FOUND para slugs desconocidos o no disponibles", async () => {
  rpc.mockResolvedValue({ data: response([]), error: null });
  await expect(getPublicOffer(offer.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("mantiene el RPC de listado y devuelve slug e identidad UUID", async () => {
  await expect(listPublicOffers({ page: 1, pageSize: 1 })).resolves.toEqual(response());
  expect(rpc).toHaveBeenCalledExactlyOnceWith("published_offers", { p_page: 1, p_page_size: 1 });
});
it.each([undefined, null, "../auxiliar-a1b2c3d4e5f6"])("rechaza respuestas con slug ausente o inseguro (%s)", async (slug) => {
  rpc.mockResolvedValue({ data: response([{ ...offer, slug } as typeof offer]), error: null });
  await expect(listPublicOffers({})).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it.each([getPublicOffer, () => listPublicOffers({})])("no convierte errores técnicos en NOT_FOUND", async (lookup) => {
  rpc.mockResolvedValue({ data: null, error: { message: "Fallo ficticio" } });
  await expect(lookup(offer.slug)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});

it("resuelve el slug persistido y conserva la identidad UUID aunque cambie el título", async () => {
  await expect(getPublicOffer(offer.slug)).resolves.toEqual(offer);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("published_offer_by_slug", { p_slug: offer.slug });
});