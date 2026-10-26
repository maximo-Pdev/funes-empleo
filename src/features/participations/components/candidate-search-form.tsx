"use client";
import { Form } from "@/components/forms/form";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, SelectField, TextField } from "@/components/ui";
import { LocalityCombobox } from "@/features/companies/components/locality-combobox";
import type { CandidateSearchFilters } from "@/validation/candidate-search";

type SearchValues = Omit<CandidateSearchFilters, "page" | "pageSize">;

export function CandidateSearchForm({ categories, initial, onSearch, destination = "/admin/candidates" }: {
  categories: readonly { id: string; name: string; reference?: string }[];
  initial?: Partial<SearchValues>;
  onSearch?: (filters: SearchValues) => void;
  destination?: "/admin/candidates" | "/admin/atencion-presencial";
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initial?.term ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [locality, setLocality] = useState(initial?.locality ?? "");
  const [eligibility, setEligibility] = useState<SearchValues["eligibility"]>(initial?.eligibility ?? "eligible");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters: SearchValues = { term: term.trim(), categoryId: categoryId || undefined,
      availability: availability.trim(), locality: locality.trim(), eligibility };
    if (onSearch) { onSearch(filters); return; }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    if (categoryId) {
      const reference = categories.find(category => category.id === categoryId)?.reference;
      if (!reference) return;
      params.set("categoryId", reference);
    }
    router.push(`${destination}?${params.toString()}`);
  }

  return <Form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-300 bg-white p-5 sm:grid-cols-2" role="search">
    <TextField id="candidate-term" label="Búsqueda por palabra" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={100} />
    <SelectField id="candidate-category" label="Categoría" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}
      options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Todas las categorías" />
    <SelectField id="candidate-availability" label="Disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)}
      placeholder="Todas las disponibilidades" options={[{ value: "available", label: "Disponible" }, { value: "unavailable", label: "No disponible" },
        ...(!["", "available", "unavailable"].includes(availability) ? [{ value: availability, label: "Filtro anterior" }] : [])]} />
    <LocalityCombobox value={locality} onChange={(value) => setLocality(value ?? "")} aria-label="Localidad" placeholder="Todas las localidades" />
    <SelectField id="candidate-eligibility" label="Aptitud para derivación" value={eligibility} onChange={(event) => setEligibility(event.target.value as SearchValues["eligibility"])}
      placeholder={null} options={[{ value: "eligible", label: "Aptos" }, { value: "ineligible", label: "No aptos" }, { value: "all", label: "Todos" }]} />
    <div className="flex items-end"><Button type="submit">Buscar candidatos</Button></div>
  </Form>;
}
