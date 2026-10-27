"use client";
import { useState } from "react";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from "@/components/ui";
import { FieldHelp } from "@/components/forms/field-help";

export function CandidateCategoryFilter({ options, initial }: {
  options: readonly { value: string; label: string }[]; initial: string[];
}) {
  const [selected, setSelected] = useState(initial);
  return <div className="grid gap-1">
    <span className="text-sm font-semibold inline-flex items-center gap-1">Categorías<FieldHelp label="Categorías"
      description="Elegí una o varias categorías laborales. El candidato debe tener al menos una de las seleccionadas." /></span>
    {selected.map(reference => <input key={reference} type="hidden" name="categoryId" value={reference} />)}
    <Combobox multiple value={selected} onValueChange={setSelected}>
      <ComboboxTrigger aria-label="Categorías"><span className={selected.length ? "" : "text-muted-foreground"}>
        {selected.length ? `${selected.length} seleccionadas` : "Todas las categorías"}</span></ComboboxTrigger>
      <ComboboxContent aria-label="Filtrar por categorías"><ComboboxInput placeholder="Buscar categoría…" aria-label="Buscar categoría" />
        <ComboboxList aria-label="Categorías disponibles para filtrar">{options.map(option => <ComboboxItem key={option.value} value={option.value}>{option.label}</ComboboxItem>)}</ComboboxList>
        <ComboboxEmpty>Sin resultados</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  </div>;
}
