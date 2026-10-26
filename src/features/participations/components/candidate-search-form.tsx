"use client";
import { Form } from "@/components/forms/form";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button, Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger, SelectField, TextField } from "@/components/ui";
import { LocalityCombobox } from "@/features/companies/components/locality-combobox";
import { FieldHelp } from "@/components/forms/field-help";
import type { CandidateSearchFilters } from "@/validation/candidate-search";

type SearchValues = Omit<CandidateSearchFilters, "page" | "pageSize">;

export function CandidateSearchForm({ categories, initial, onSearch, destination = "/admin/candidates" }: {
  categories: readonly { id: string; name: string; reference?: string }[];
  initial?: Partial<SearchValues>;
  onSearch?: (filters: SearchValues) => void;
  destination?: "/admin/candidates" | "/admin/atencion-presencial";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(initial?.term ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryId ?? []);
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [locality, setLocality] = useState(initial?.locality ?? "");
  const [eligibility, setEligibility] = useState<SearchValues["eligibility"]>(initial?.eligibility ?? "eligible");
  const categoryActions = useRef<{ unmount: () => void; close: () => void } | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters: SearchValues = { term: term.trim(), categoryId: categoryIds,
      availability: availability.trim(), locality: locality.trim(), eligibility };
    if (onSearch) { onSearch(filters); return; }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "categoryId") continue;
      if (value) params.set(key, String(value));
    }
    for (const id of categoryIds) {
      const reference = categories.find(category => category.id === id)?.reference;
      if (reference) params.append("categoryId", reference);
    }
    startTransition(() => router.push(`${destination}?${params.toString()}`));
  }

  return <Form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-300 bg-white p-5 sm:grid-cols-2" role="search">
    <TextField id="candidate-term" label="Búsqueda por palabra" help="Busca una palabra en el nombre, el resumen de habilidades y la localidad del perfil del candidato." value={term} onChange={(event) => setTerm(event.target.value)} maxLength={100} />
    <div className="grid gap-1">
      <span className="text-sm font-semibold inline-flex items-center gap-1">Categorías<FieldHelp label="Categorías" description="Elegí una o varias categorías laborales. El candidato debe tener al menos una de las seleccionadas." /></span>
      <Combobox multiple value={categoryIds} actionsRef={categoryActions}
        onValueChange={next => { setCategoryIds(next); categoryActions.current?.close(); }}>
        <ComboboxTrigger aria-label="Categorías">
          <span className={categoryIds.length ? "" : "text-muted-foreground"}>
            {categoryIds.length ? `${categoryIds.length} seleccionadas` : "Todas las categorías"}
          </span>
        </ComboboxTrigger>
        <ComboboxContent aria-label="Elegir categorías">
          <ComboboxInput placeholder="Buscar categoría…" aria-label="Buscar categoría" />
          <ComboboxList aria-label="Categorías: opciones">
            {categories.map(category => <ComboboxItem key={category.id} value={category.id}>{category.name}</ComboboxItem>)}
          </ComboboxList>
          <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
    <SelectField id="candidate-availability" label="Disponibilidad" help="Indica si el candidato está disponible para trabajar en este momento." value={availability} onChange={(event) => setAvailability(event.target.value)}
      placeholder="Todas las disponibilidades" options={[{ value: "available", label: "Disponible" }, { value: "unavailable", label: "No disponible" },
        ...(!["", "available", "unavailable"].includes(availability) ? [{ value: availability, label: "Filtro anterior" }] : [])]} />
    <div className="grid gap-1">
      <span className="text-sm font-semibold inline-flex items-center gap-1">Localidad<FieldHelp label="Localidad" description="Localidad de residencia del candidato." /></span>
      <LocalityCombobox value={locality} onChange={(value) => setLocality(value ?? "")} aria-label="Localidad" placeholder="Todas las localidades" />
    </div>
    <SelectField id="candidate-eligibility" label="Aptitud para derivación" help="Aptos cumplen los requisitos para una nueva derivación; No aptos no los cumplen; Todos muestra ambos." value={eligibility} onChange={(event) => setEligibility(event.target.value as SearchValues["eligibility"])}
      placeholder={null} options={[{ value: "eligible", label: "Aptos" }, { value: "ineligible", label: "No aptos" }, { value: "all", label: "Todos" }]} />
    <div className="flex items-end"><Button type="submit" disabled={isPending} aria-busy={isPending}>
      {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{isPending ? "Buscando…" : "Buscar candidatos"}
    </Button></div>
  </Form>;
}
