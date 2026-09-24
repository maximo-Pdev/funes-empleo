"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, SelectField, TextField } from "@/components/ui";
import type { CandidateSearchFilters } from "@/validation/candidate-search";

type SearchValues = Omit<CandidateSearchFilters, "page" | "pageSize">;

export function CandidateSearchForm({ categories, initial, onSearch }: {
  categories: readonly { id: string; name: string }[];
  initial?: Partial<SearchValues>;
  onSearch?: (filters: SearchValues) => void;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initial?.term ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [skills, setSkills] = useState(initial?.skills ?? "");
  const [availability, setAvailability] = useState(initial?.availability ?? "");
  const [locality, setLocality] = useState(initial?.locality ?? "");
  const [vigency, setVigency] = useState<SearchValues["vigency"]>(initial?.vigency ?? "current");
  const [eligibility, setEligibility] = useState<SearchValues["eligibility"]>(initial?.eligibility ?? "eligible");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const filters: SearchValues = { term: term.trim(), categoryId: categoryId || undefined,
      skills: skills.trim(), availability: availability.trim(), locality: locality.trim(), vigency, eligibility };
    if (onSearch) { onSearch(filters); return; }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    router.push(`/admin/candidates?${params.toString()}`);
  }

  return <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-300 bg-white p-5 sm:grid-cols-2" role="search">
    <TextField id="candidate-term" label="Término" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={100} />
    <SelectField id="candidate-category" label="Categoría" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}
      options={categories.map((category) => ({ value: category.id, label: category.name }))} placeholder="Todas las categorías" />
    <TextField id="candidate-skills" label="Habilidades" value={skills} onChange={(event) => setSkills(event.target.value)} maxLength={100} />
    <TextField id="candidate-availability" label="Disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)} maxLength={100} />
    <TextField id="candidate-locality" label="Localidad" value={locality} onChange={(event) => setLocality(event.target.value)} maxLength={100} />
    <SelectField id="candidate-vigency" label="Vigencia" value={vigency} onChange={(event) => setVigency(event.target.value as SearchValues["vigency"])}
      options={[{ value: "current", label: "Vigente" }, { value: "needs_update", label: "Necesita actualización" }, { value: "all", label: "Todas" }]} />
    <SelectField id="candidate-eligibility" label="Aptitud para derivación" value={eligibility} onChange={(event) => setEligibility(event.target.value as SearchValues["eligibility"])}
      options={[{ value: "eligible", label: "Aptos" }, { value: "ineligible", label: "No aptos" }, { value: "all", label: "Todos" }]} />
    <div className="flex items-end"><Button type="submit">Buscar candidatos</Button></div>
  </form>;
}
