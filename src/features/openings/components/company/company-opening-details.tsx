import type { CompanyOffer } from "../../company-service";
import { formatPublicClosingDate, publicContractTypeLabel, publicModalityLabel } from "../../public-offer-display";

export function CompanyOpeningDetails({ opening }: { opening: CompanyOffer }) {
  const fields: [string, string | number | null][] = [
    ["Vacantes", opening.vacancies], ["Ubicación", opening.location],
    ["Modalidad", opening.modality ? publicModalityLabel(opening.modality) : null],
    ["Horario", opening.schedule],
    ["Tipo de contratación", opening.contract_type ? publicContractTypeLabel(opening.contract_type) : null],
    ["Fecha de cierre", opening.closingDate ? formatPublicClosingDate(opening.closingDate) : null],
    ["Salario", opening.salary], ["Beneficios", opening.benefits],
    ["Categorías laborales", opening.categories.map(category => category.name).join(", ")],
  ];
  return <section aria-label="Información de la oferta" className="space-y-5 rounded-lg border border-border bg-surface p-5">
    <h2 className="text-xl font-semibold">Información de la oferta</h2>
    {[["Tareas", opening.tasks], ["Requisitos", opening.requirements]].map(([label, value]) =>
      <div key={label}><h3 className="font-semibold">{label}</h3><p className="whitespace-pre-line">{value || "Sin informar"}</p></div>)}
    <dl className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}>
      <dt className="font-semibold">{label}</dt><dd className="whitespace-pre-line">{value === null || value === "" ? "Sin informar" : value}</dd>
    </div>)}</dl>
  </section>;
}
