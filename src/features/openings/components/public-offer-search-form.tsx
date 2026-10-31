"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { Form } from "@/components/forms/form";
import { Button, SelectField, TextField } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicOfferSearch } from "@/validation/public-offer-search";
import type { PublicOfferFilterOptions } from "../public-service";
import { publicModalityLabel } from "../public-offer-display";

type Option = { value: string; label: string };

function withCurrentValue(values: readonly Option[], current: string, unavailable: string): Option[] {
  const options = [...values];
  if (current && !options.some(option => option.value === current)) options.push({ value: current, label: unavailable });
  return options;
}

export function PublicOfferSearchForm({ filters, options }: { filters: PublicOfferSearch; options: PublicOfferFilterOptions }) {
  const selects = [
    { name: "rubro", label: "Rubro", empty: "Todos los rubros", unavailable: "Rubro no disponible", values: options.categories },
    { name: "localidad", label: "Localidad", empty: "Todas las localidades", unavailable: "Localidad no disponible", values: options.localities },
    { name: "modalidad", label: "Modalidad", empty: "Todas las modalidades", unavailable: "Modalidad no disponible", values: options.modalities },
  ] as const;
  return (
    <Form
      method="get"
      action="/ofertas"
      aria-label="Buscar ofertas laborales"
      className="grid gap-5 rounded-xl border border-border bg-surface p-5 shadow-card sm:grid-cols-2 sm:p-6"
    >
      <div className="min-w-0 sm:col-span-2">
        <TextField
          id="public-offer-q"
          name="q"
          type="search"
          label="Buscar por texto"
          defaultValue={filters.q}
          maxLength={120}
          placeholder="Título, tareas o requisitos"
        />
      </div>
      {selects.map(select => (
        <SelectField
          key={select.name}
          id={`public-offer-${select.name}`}
          name={select.name}
          label={select.label}
          defaultValue={filters[select.name]}
          placeholder={select.empty}
          options={withCurrentValue(
            select.name === "modalidad"
              ? select.values.map(option => ({ value: option.value, label: publicModalityLabel(option.label) }))
              : select.values,
            filters[select.name],
            select.unavailable,
          )}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar ofertas
        </Button>
        <Link href="/ofertas" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <X className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </Link>
      </div>
    </Form>
  );
}
