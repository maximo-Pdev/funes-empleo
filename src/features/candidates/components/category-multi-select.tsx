"use client";

import { useContext, useEffect, useId, useRef, useState } from "react";
import { Field } from "@/components/forms/field";
import { FormErrorsContext, FormSummarizedFieldsContext } from "@/components/forms/form";
import { X } from "lucide-react";
import { CategoryLabel } from "@/components/job-category-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";

// Repeated transport inputs preserve the existing FormData contract.
export function CategoryMultiSelect({ categories, name = "categories", defaultSelected = [], value, onChange,
  label = "Categorías laborales", placeholder = "Seleccionar categorías", closeOnSelect = false, required = false }: {
  categories: readonly { id: string; name: string }[];
  name?: string;
  defaultSelected?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  closeOnSelect?: boolean;
  required?: boolean;
}) {
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultSelected);
  const selected = value ?? internalSelected;
  const id = useId();
  const proxy = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const error = useContext(FormErrorsContext)[id];
  const summarized = useContext(FormSummarizedFieldsContext);
  const [initialSelection] = useState(selected.length ? "selected" : "");
  useEffect(() => {
    const next = selected.length ? "selected" : "";
    if (!proxy.current || proxy.current.value === next) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(proxy.current, next);
    proxy.current.dispatchEvent(new Event("input", { bubbles: true }));
  }, [selected.length]);
  const actions = useRef<{ unmount: () => void; close: () => void } | null>(null);
  function setSelected(next: string[]) {
    if (value === undefined) setInternalSelected(next);
    onChange?.(next);
  }
  return (
    <>
      {required && <Field label={<span className="sr-only">{label}</span>} className="sr-only">
        <input ref={proxy} id={id} defaultValue={initialSelection} required className="sr-only" tabIndex={-1}
          aria-hidden="true" aria-label="Valor del formulario" onFocus={() => trigger.current?.focus()} />
      </Field>}
      {selected.map(id => <input key={id} type="hidden" name={name} value={id} />)}
      <Combobox multiple value={selected} actionsRef={actions} onValueChange={next => {
        setSelected(next);
        if (closeOnSelect) actions.current?.close();
      }}>
        <ComboboxTrigger ref={trigger} aria-label={label} aria-required={required} aria-invalid={Boolean(error)}
          aria-describedby={error && !summarized.includes(id) ? `${id}-error` : undefined}>
          <span className={selected.length ? "" : "text-muted-foreground"}>
            {selected.length ? `${selected.length} seleccionadas` : placeholder}
          </span>
        </ComboboxTrigger>
        <ComboboxContent aria-label={`Elegir ${label.toLowerCase()}`}>
          <ComboboxInput placeholder="Buscar categoría…" aria-label="Buscar categoría" />
          <ComboboxList aria-label={`${label}: opciones`}>
            {categories.map(category => <ComboboxItem key={category.id} value={category.id}><CategoryLabel name={category.name} /></ComboboxItem>)}
          </ComboboxList>
          <ComboboxEmpty>Sin resultados</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      {selected.length > 0 && <ul aria-label="Categorías seleccionadas" className="flex flex-wrap gap-2">
        {selected.map(id => {
          const category = categories.find(category => category.id === id);
          if (!category) return null;
          return <li key={id}><Badge variant="secondary" className="max-w-full whitespace-normal gap-1">
            <CategoryLabel name={category.name} />
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Quitar ${category.name}`}
              onClick={() => setSelected(selected.filter(value => value !== id))}><X aria-hidden="true" /></Button>
          </Badge></li>;
        })}
      </ul>}
    </>
  );
}
