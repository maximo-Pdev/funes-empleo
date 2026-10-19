import Link from "next/link";
import type { PublicOfferSearch } from "@/validation/public-offer-search";
import type { PublicOfferFilterOptions } from "../public-service";
import { publicModalityLabel } from "../public-offer-display";

export function PublicOfferSearchForm({ filters, options }: { filters: PublicOfferSearch; options: PublicOfferFilterOptions }) {
  const field = "min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-foreground";
  const selects = [
    { name: "rubro", label: "Rubro", empty: "Todos los rubros", unavailable: "Rubro no disponible", values: options.categories },
    { name: "localidad", label: "Localidad", empty: "Todas las localidades", unavailable: "Localidad no disponible", values: options.localities },
    { name: "modalidad", label: "Modalidad", empty: "Todas las modalidades", unavailable: "Modalidad no disponible", values: options.modalities },
  ] as const;
  return <form method="get" action="/ofertas" aria-label="Buscar ofertas laborales" className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
    <div className="min-w-0 grid gap-1 text-sm font-semibold sm:col-span-2">
      <label htmlFor="public-offer-q">Buscar por texto</label>
      <input id="public-offer-q" className={field} type="search" name="q" defaultValue={filters.q} maxLength={120} placeholder="Título, tareas o requisitos" />
    </div>
    {selects.map(select => <div key={select.name} className="min-w-0 grid gap-1 text-sm font-semibold">
      <label htmlFor={`public-offer-${select.name}`}>{select.label}</label>
      <select id={`public-offer-${select.name}`} className={field} name={select.name} defaultValue={filters[select.name]}>
        <option value="">{select.empty}</option>
        {filters[select.name] && !select.values.some(option => option.value === filters[select.name]) &&
          <option value={filters[select.name]}>{select.unavailable}</option>}
        {select.values.map(option => <option key={option.value} value={option.value}>
          {select.name === "modalidad" ? publicModalityLabel(option.label) : option.label}
        </option>)}
      </select>
    </div>)}
    <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
      <button type="submit" className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-700">Buscar ofertas</button>
      <Link href="/ofertas" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary underline underline-offset-4">Limpiar filtros</Link>
    </div>
  </form>;
}
