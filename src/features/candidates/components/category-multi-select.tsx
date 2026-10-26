"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";

// Selección múltiple de categorías laborales con inputs ocultos para el FormData.
export function CategoryMultiSelect({ categories, name = "categories", defaultSelected = [] }: {
  categories: readonly { id: string; name: string }[];
  name?: string;
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  return (
    <>
      {selected.map(id => <input key={id} type="hidden" name={name} value={id} />)}
      <Combobox multiple value={selected} onValueChange={setSelected}>
        <ComboboxTrigger aria-label="Categorías laborales">
          <span className={selected.length ? "" : "text-muted-foreground"}>
            {selected.length ? `${selected.length} seleccionadas` : "Seleccionar categorías"}
          </span>
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar categoría…" aria-label="Buscar categoría" />
          <ComboboxList>
            {categories.map(category => <ComboboxItem key={category.id} value={category.id}>{category.name}</ComboboxItem>)}
          </ComboboxList>
          <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </>
  );
}
