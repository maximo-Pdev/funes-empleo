import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors/public-error";
import { EmptyState } from "@/components/ui/page-state";
import { CompanyReferralPanel } from "@/features/referrals/components/company-referral-panel";
import { getCompanyReferral, listCompanyReferralReferences } from "@/features/referrals/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ openingId: string }>;
  searchParams: Promise<{ referral?: string }>;
};

export default async function CompanyReferralsPage({ params, searchParams }: Props) {
  await requireActiveAccount(["company"]);
  const { openingId } = await params;
  const requested = (await searchParams).referral;
  let references;
  try { references = await listCompanyReferralReferences(openingId); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  const selectedId = requested ?? references[0]?.referral_id;
  let selected = null;
  if (selectedId) {
    try { selected = await getCompanyReferral(openingId, selectedId); }
    catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  }
  return (
    <main id="contenido" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Ruta de navegación"><Link href="/account" className="text-blue-800 underline">Mi cuenta</Link></nav>
      <h1 className="mt-5 text-3xl font-bold">Candidatos derivados</h1>
      <p className="mt-2 text-slate-700">Solo aparecen derivaciones de esta oferta. La Oficina de Empleo decide qué perfiles compartir y confirma los resultados finales.</p>
      {references.length === 0 ? <div className="mt-8"><EmptyState title="Todavía no hay derivaciones" description="La Oficina te avisará cuando derive candidatos para esta oferta." /></div> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
          <nav aria-label="Derivaciones de esta oferta" className="rounded-lg border border-slate-300 bg-white p-4">
            <h2 className="text-lg font-semibold">Derivaciones</h2>
            <ul className="mt-3 space-y-2">{references.map((item) => <li key={item.referral_id}>
              <Link href={`/company/openings/${openingId}/referrals?referral=${item.referral_id}`}
                aria-current={selectedId === item.referral_id ? "page" : undefined}
                className="block break-words rounded-md border border-slate-300 p-3 text-blue-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700">
                <span className="block font-medium">{item.opening_title ?? "Oferta"}</span>
                <span className="block text-sm">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "America/Buenos_Aires" }).format(new Date(item.referred_at))}</span>
                <span className="block break-all text-xs">{item.referral_id}</span>
              </Link>
            </li>)}</ul>
          </nav>
          {selected && <CompanyReferralPanel referral={selected} openingId={openingId} />}
        </div>
      )}
    </main>
  );
}
