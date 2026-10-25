import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getPanelHref } from "@/features/accounts/navigation";
import { renderCandidateAccount, type AccountSearchParams } from "../account/candidate-account";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<AccountSearchParams> } = {}) {
  const { account, user } = await requireActiveAccount();
  if (account.role !== "candidate") redirect(getPanelHref(account.role));
  return renderCandidateAccount({ params: await searchParams, email: user?.email, basePath: "/dashboard" });
}
