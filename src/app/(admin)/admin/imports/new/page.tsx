import { notFound } from "next/navigation";
import { referenceFilters } from "@/lib/records/page-references";
import { recordReference } from "@/lib/records/references";
import { requireActiveAccount } from "@/lib/auth/guards";
import { ImportUpload } from "@/features/imports/components/upload";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ retry?: string }> }) {
  const { user } = await requireActiveAccount(["admin"]);
  const query = await referenceFilters("/admin/imports/new", await searchParams, { retry: "import" });
  if (query.retry !== undefined && (typeof query.retry !== "string" || query.retry === "invalid-reference")) notFound();
  const retry = typeof query.retry === "string" && query.retry !== "invalid-reference" ? await recordReference("import", query.retry) : undefined;
  return <AdminShell email={user?.email} active="/admin/imports" title="Importación de demostración" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportUpload retry={retry} /></AdminShell>;
}
