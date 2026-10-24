import { expect, type Page } from "@playwright/test";
import { runLocalMaintenanceSql } from "../local-maintenance";

// UI nominations start from the offer. Database reads locate a deterministic
// fixture on its matching page and the resulting case; they never create it.
export async function nominateFromOpening(page: Page, candidateId: string, openingId: string) {
  for (const id of [candidateId, openingId]) expect(id).toMatch(/^[0-9a-f-]{36}$/);
  const raw = runLocalMaintenanceSql(`select jsonb_build_object('name',display_name,'page',((position-1)/12)+1)
    from (select id,display_name,row_number() over(order by display_name,id) position from private.opening_candidate_pool('${openingId}')) pool
    where id='${candidateId}'`);
  expect(raw, "El candidato ficticio debe cumplir el matching de la oferta").not.toBe("");
  const match = JSON.parse(raw) as { name: string; page: number };
  await page.goto(`/admin/openings/${openingId}?matchPage=${match.page}`);
  const region = page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true });
  await region.getByRole("button", { name: `Ver perfil de ${match.name}`, exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Nominar a esta oferta", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(region.getByRole("status")).toContainText("Candidato nominado a esta oferta");
  const participationId = runLocalMaintenanceSql(`select id from public.participations where candidate_id='${candidateId}' and opening_id='${openingId}' and archived_at is null`);
  expect(participationId).toMatch(/^[0-9a-f-]{36}$/);
  await page.goto(`/admin/participations/${participationId}`);
  await expect(page).toHaveURL(/\/admin\/participations\/cas-[0-9a-f]{24}$/);
}
