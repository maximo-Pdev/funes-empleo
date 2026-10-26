"use client";

// Localidad seleccionable con búsqueda (catálogo fijo) + input oculto para el FormData.
import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { LOCALITIES } from "@/domain/catalogs/localities";

export function LocalityCombobox({ defaultValue, name = "locality", "aria-label": ariaLabel = "Localidad" }: { defaultValue?: string; name?: string; "aria-label"?: string }) {
  const [value, setValue] = useState<string | null>(defaultValue?.trim() || null);
  return (
    <>
      <input type="hidden" name={name} value={value ?? ""} required minLength={2} />
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger aria-label={ariaLabel}>
          <ComboboxValue placeholder={<span className="text-muted-foreground">Seleccioná una localidad</span>} />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput placeholder="Buscar localidad…" aria-label="Buscar localidad" />
          <ComboboxList>
            {LOCALITIES.map(locality => (
              <ComboboxItem key={locality} value={locality}>{locality}</ComboboxItem>
            ))}
          </ComboboxList>
          <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </>
  );
}
