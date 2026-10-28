"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/forms/field";
import { FormErrorsContext, FormSummarizedFieldsContext } from "@/components/forms/form";
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

export function LocalityCombobox({ defaultValue, value: controlledValue, onChange, name, label, required = true, "aria-label": ariaLabel = "Localidad", placeholder = "Seleccioná una localidad" }: {
  defaultValue?: string; value?: string; onChange?: (value: string | null) => void; name?: string; label?: string; required?: boolean; "aria-label"?: string; placeholder?: string;
}) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue?.trim() || null);
  const value = controlledValue === undefined ? internalValue : (controlledValue.trim() || null);
  const [initialValue] = useState(value ?? "");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const errors = useContext(FormErrorsContext);
  const summarized = useContext(FormSummarizedFieldsContext);
  const error = errors[id];
  const description = error && !summarized.includes(id) ? `${id}-error` : undefined;
  useEffect(() => {
    if (!input.current || input.current.value === (value ?? "")) return;
    // Notify Form through its native control, including controlled updates.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input.current, value ?? "");
    input.current.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);
  return (
    <Field label={label ?? <span className="sr-only">{ariaLabel}</span>} className={label ? "grid gap-1" : "sr-only"}>
      {name && <input ref={input} id={id} name={name} defaultValue={initialValue} required={required} minLength={2}
        className="sr-only" tabIndex={-1} aria-hidden="true" onFocus={() => trigger.current?.focus()} />}
      <Combobox value={value} onValueChange={next => {
        if (controlledValue === undefined) setInternalValue(next);
        onChange?.(next);
      }}>
        <ComboboxTrigger ref={trigger} aria-label={ariaLabel} aria-required={Boolean(name && required)}
          aria-invalid={Boolean(error)} aria-describedby={description}>
          <ComboboxValue placeholder={<span className="text-muted-foreground">{placeholder}</span>} />
        </ComboboxTrigger>
        <ComboboxContent aria-label="Seleccionar localidad">
          <ComboboxInput placeholder="Buscar localidad…" aria-label="Buscar localidad" />
          <ComboboxList aria-label="Localidades disponibles">
            {LOCALITIES.map(locality => (
              <ComboboxItem key={locality} value={locality}>{locality}</ComboboxItem>
            ))}
          </ComboboxList>
          <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
