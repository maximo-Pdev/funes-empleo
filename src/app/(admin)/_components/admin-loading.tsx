import { WorkspaceLoading } from "@/components/ui/workspace-loading";

export function AdminLoading({ title }: { title: string; active: string }) {
  return <WorkspaceLoading title={`${title}…`} />;
}
