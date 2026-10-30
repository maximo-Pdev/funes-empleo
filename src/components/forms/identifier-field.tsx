"use client";

import { useId, useState, type ComponentProps } from "react";
import { Field } from "@/components/forms/field";
import { InputVisibilityToggle } from "@/components/forms/input-visibility-toggle";
import { cn } from "@/lib/utils";

type IdentifierFieldProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  label: "DNI" | "CUIT";
};

export function IdentifierField({ label, id, className, ...input }: IdentifierFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);


  return <Field label={label} className="block">
    <div className="mt-1 flex items-stretch gap-2">
      <input {...input} id={inputId} type={visible ? "text" : "password"}
        className={cn("min-w-0 w-full", className)} />
      <InputVisibilityToggle inputId={inputId} description={label} visible={visible} onToggle={() => setVisible(previous => !previous)} />
    </div>
  </Field>;
}
