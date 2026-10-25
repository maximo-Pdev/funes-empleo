"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IdentifierFieldProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  label: "DNI" | "CUIT";
};

export function IdentifierField({ label, id, className, ...input }: IdentifierFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const action = `${visible ? "Ocultar" : "Mostrar"} ${label}`;

  return <Field label={label} className="block">
    <div className="mt-1 flex items-stretch gap-2">
      <input {...input} id={inputId} type={visible ? "text" : "password"}
        className={cn("min-w-0 w-full", className)} />
      <Button type="button" variant="outline" size="icon" aria-controls={inputId}
        aria-pressed={visible} aria-label={action} title={action}
        onClick={() => setVisible(previous => !previous)}>
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  </Field>;
}
