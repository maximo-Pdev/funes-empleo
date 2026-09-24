import { LoadingState } from "@/components/ui";

export default function AdminLoading() {
  return <div className="mx-auto max-w-6xl px-4 py-8"><LoadingState message="Cargando información de la Oficina de Empleo…" /></div>;
}
