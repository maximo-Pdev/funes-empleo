import { redirect } from "next/navigation";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { recordReference } from "@/lib/records/references";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AssistedDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  await requireActiveAccount(["admin"]);
  const { candidateId: reference } = await params;
  const candidateId = await pageRecordIdentifier("candidate", reference, `/admin/candidates/${reference}`);
  redirect(`/admin/candidates/${await recordReference("candidate", candidateId)}`);
}
