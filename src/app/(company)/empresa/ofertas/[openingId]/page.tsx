import { notFound } from "next/navigation";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { companyNavigation } from "@/features/companies/navigation";
import { listCompanyCategories, listCompanyOffers } from "@/features/openings/company-service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

export const dynamic = "force-dynamic";
export default async function CompanyOpeningPage({ params }: { params: Promise<{ openingId: string }> }) {
  await requireActiveAccount(["company"]);
  const { openingId } = await params;
  const [categories, offers] = await Promise.all([listCompanyCategories(), listCompanyOffers(1, openingId)]);
  const opening = offers.items[0];
  if (!opening) notFound();
  return <RoleShell role="company" title={opening.title || "Borrador de oferta"} navigation={companyNavigation}>
    <CompanyOpeningForm opening={opening} categories={categories} />
    <a className="mt-6 block text-blue-800 underline" href={`/company/openings/${opening.id}/referrals`}>Ver derivaciones de esta oferta</a>
  </RoleShell>;
}
