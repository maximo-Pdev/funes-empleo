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

export function LocalityCombobox({ defaultValue, value: controlledValue, onChange, name, required = true, "aria-label": ariaLabel = "Localidad", placeholder = "Seleccioná una localidad" }: {
  defaultValue?: string; value?: string; onChange?: (value: string | null) => void; name?: string; required?: boolean; "aria-label"?: string; placeholder?: string;
}) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue?.trim() || null);
  const value = controlledValue === undefined ? internalValue : (controlledValue.trim() || null);
  const setValue = onChange ?? setInternalValue;
  return (
    <>
      {name && <input type="hidden" name={name} value={value ?? ""} required={required} minLength={2} />}
      <Combobox value={value} onValueChange={setValue}>
        <ComboboxTrigger aria-label={ariaLabel}>
          <ComboboxValue placeholder={<span className="text-muted-foreground">{placeholder}</span>} />
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
