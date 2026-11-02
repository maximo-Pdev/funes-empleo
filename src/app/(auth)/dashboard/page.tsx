import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getPanelHref } from "@/features/accounts/navigation";
import { renderCandidateAccount, type AccountSearchParams } from "../account/candidate-account";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<AccountSearchParams> } = {}) {
  const params = await searchParams;
  const { account, user } = await requireActiveAccount(undefined, params.section === "ofertas" ? { anonymousRedirect: "/" } : {});
  if (account.role !== "candidate") redirect(getPanelHref(account.role));
  return renderCandidateAccount({ params, email: user?.email, basePath: "/dashboard" });
}
