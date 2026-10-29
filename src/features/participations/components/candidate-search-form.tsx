import { Form } from "@/components/forms/form";
import { Button, SelectField, TextField } from "@/components/ui";
import { LocalityCombobox } from "@/features/companies/components/locality-combobox";
import { FieldHelp } from "@/components/forms/field-help";
import type { CandidateSearchFilters } from "@/validation/candidate-search";
import { CandidateCategoryFilter } from "./candidate-category-filter";

type SearchValues = Omit<CandidateSearchFilters, "page" | "pageSize">;
export function CandidateSearchForm({ categories, initial, destination = "/admin/candidates" }: {
  categories: readonly { id: string; name: string; reference?: string }[];
  initial?: Partial<SearchValues>;
  destination?: "/admin/candidates" | "/admin/atencion-presencial";
}) {
  const availability = initial?.availability ?? "";
  const options = categories.flatMap(category => category.reference ? [{ value: category.reference, label: category.name }] : []);
  const selected = categories.flatMap(category => category.reference && initial?.categoryId?.includes(category.id) ? [category.reference] : []);
  return <Form method="get" action={destination} className="grid gap-4 rounded-lg border border-slate-300 bg-white p-5 sm:grid-cols-2" role="search">
    <TextField id="candidate-term" name="term" label="Búsqueda por palabra" help="Busca una palabra en el nombre, el resumen de habilidades y la localidad del perfil del candidato." defaultValue={initial?.term ?? ""} maxLength={100} />
    <CandidateCategoryFilter options={options} initial={selected} />
    <SelectField id="candidate-availability" name="availability" label="Disponibilidad" help="Indica si el candidato está disponible para trabajar en este momento." defaultValue={availability}
      placeholder="Todas las disponibilidades" options={[{ value: "available", label: "Disponible" }, { value: "unavailable", label: "No disponible" },
        ...(!["", "available", "unavailable"].includes(availability) ? [{ value: availability, label: "Filtro anterior" }] : [])]} />
    <div className="relative grid gap-1">
      <span className="text-sm font-semibold inline-flex items-center gap-1">Localidad<FieldHelp label="Localidad" description="Localidad de residencia del candidato." /></span>
      <LocalityCombobox name="locality" defaultValue={initial?.locality ?? ""} required={false} aria-label="Localidad" placeholder="Todas las localidades" />
    </div>
    <SelectField id="candidate-eligibility" name="eligibility" label="Aptitud para derivación" help="Aptos cumplen los requisitos para una nueva derivación; No aptos no los cumplen; Todos muestra ambos." defaultValue={initial?.eligibility ?? "eligible"}
      placeholder={null} options={[{ value: "eligible", label: "Aptos" }, { value: "ineligible", label: "No aptos" }, { value: "all", label: "Todos" }]} />
    <div className="flex items-end"><Button type="submit">Buscar candidatos</Button></div>
  </Form>;
}
