import { redirect, notFound } from "next/navigation";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { referenceUrl } from "@/lib/records/reference-url";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompanyReferralsPage({ params, searchParams }: {
  params: Promise<{ openingId: string }>; searchParams: Promise<{ referral?: string }>;
}) {
  await requireActiveAccount(["company"]);
  const { openingId: reference } = await params;
  const query = await searchParams;
  if (query.referral !== undefined && typeof query.referral !== "string") notFound();
  const openingId = await pageRecordIdentifier("opening", reference, `/empresa/ofertas/${reference}`, query);
  const search = query.referral ? `?referral=${encodeURIComponent(query.referral)}` : "";
  redirect(await referenceUrl(`/empresa/ofertas/${openingId}${search}#derivaciones`));
}
