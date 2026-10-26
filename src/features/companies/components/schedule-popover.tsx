"use client";

// Popover de días de la semana + rango horario de atención (campo nuevo opcional).
// Serializa la selección a un string legible dentro de un input oculto para el FormData.
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Field } from "@/components/forms/field";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0") + ":00");

function summarizeDays(days: readonly string[]): string {
  const selected = DAYS.filter(day => days.includes(day));
  if (selected.length === 0) return "";
  if (selected.length === DAYS.length) return "Todos los días";
  if (selected.length === 1) return selected[0]!;
  return `${selected[0]} a ${selected[selected.length - 1]}`;
}

export function SchedulePopover({ name = "schedule", "aria-label": ariaLabel = "Horario de atención" }: { name?: string; "aria-label"?: string }) {
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("16:00");
  const summary = days.length ? `${summarizeDays(days)}, ${start} a ${end}` : "";

  const toggleDay = (day: string) =>
    setDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);

  return (
    <>
      <input type="hidden" name={name} value={summary} />
      <Popover>
        <PopoverTrigger
          aria-label={ariaLabel}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-brand-text bg-surface px-4 py-2 text-sm font-semibold text-brand-text hover:bg-surface-muted"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {summary || "Agregar horario de atención"}
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <PopoverHeader>
            <PopoverTitle>Horario de atención</PopoverTitle>
            <PopoverDescription>Días de la semana y rango horario (opcional).</PopoverDescription>
          </PopoverHeader>
          <div className="grid grid-cols-2 gap-1">
            {DAYS.map(day => (
              <Field key={day} className="flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm hover:bg-surface-muted">
                {day}
                <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} className="size-4" />
              </Field>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field className="grid gap-1 text-xs font-semibold">Desde<select value={start} onChange={event => setStart(event.target.value)} className="min-h-11 rounded-sm border border-brand-text bg-surface px-2 text-sm">
              {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
            </select></Field>
            <Field className="grid gap-1 text-xs font-semibold">Hasta<select value={end} onChange={event => setEnd(event.target.value)} className="min-h-11 rounded-sm border border-brand-text bg-surface px-2 text-sm">
              {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
            </select></Field>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
