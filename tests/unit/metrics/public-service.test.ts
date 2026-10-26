import { beforeEach, expect, it, vi } from "vitest";
const { rpc, client } = vi.hoisted(() => ({ rpc: vi.fn(), client: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: client }));
import { getPublicPortalCounts } from "@/features/metrics/public-service";

beforeEach(() => {
  vi.resetAllMocks();
  client.mockResolvedValue({ rpc });
});

it.each([{ candidates: 0, companies: 0, offers: 0 }, { candidates: 1400, companies: 23, offers: 45 }])("reads exact public totals without pagination or privileged clients", async totals => {
  rpc.mockResolvedValue({ data: totals, error: null });
  await expect(getPublicPortalCounts()).resolves.toEqual(totals);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("public_portal_counts");
});

it.each([null, {}, { candidates: -1, companies: 1, offers: 1 }, { candidates: 1.5, companies: 1, offers: 1 }, { candidates: "1", companies: 1, offers: 1 }, { candidates: 1, companies: 1, offers: 1, email: "private@example.invalid" }])("rejects malformed or nonaggregate public responses", async data => {
  rpc.mockResolvedValue({ data, error: null });
  await expect(getPublicPortalCounts()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});

it("does not turn a provider failure into fabricated zero counts", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "PRIVATE-provider-error" } });
  await expect(getPublicPortalCounts()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
