"use client";
import { CategoryMultiSelect } from "@/features/candidates/components/category-multi-select";
import { FieldHelp } from "@/components/forms/field-help";

export function CandidateCategoryFilter({ options, initial }: {
  options: readonly { value: string; label: string }[]; initial: string[];
}) {

  return <div className="grid gap-1">
    <span className="text-sm font-semibold inline-flex items-center gap-1">Categorías<FieldHelp label="Categorías"
      description="Elegí una o varias categorías laborales. El candidato debe tener al menos una de las seleccionadas." /></span>
    <CategoryMultiSelect categories={options.map(option => ({ id: option.value, name: option.label }))}
      defaultSelected={initial} name="categoryId" label="Categorías" placeholder="Todas las categorías" required={false} />
  </div>;
}
