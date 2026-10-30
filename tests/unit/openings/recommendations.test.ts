import { expect, it, vi } from "vitest";
const search = vi.hoisted(() => vi.fn());
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: search }));
import { listSuggestedOffers } from "@/features/openings/recommendations-service";

it("combines category matches without duplicates or already-applied offers", async () => {
  search.mockImplementation(async ({ rubro }: { rubro: string }) => ({ items: rubro === "ADMIN" ? [
    { id: "applied", title: "Already applied" }, { id: "shared", title: "Shared" },
  ] : [{ id: "shared", title: "Shared" }, { id: "other", title: "Other" }] }));
  const result = await listSuggestedOffers(["ADMIN", "VENTAS", "ADMIN"], ["applied"]);
  expect(result.map(item => item.id)).toEqual(["shared", "other"]);
  expect(search).toHaveBeenCalledTimes(2);
  expect(search).toHaveBeenCalledWith({ rubro: "ADMIN", page: 1, pageSize: 30 });
  expect(search).toHaveBeenCalledWith({ rubro: "VENTAS", page: 1, pageSize: 30 });
});

it("does not invent recommendations without selected categories", async () => {
  search.mockClear();
  expect(await listSuggestedOffers([], [])).toEqual([]);
  expect(search).not.toHaveBeenCalled();
});
