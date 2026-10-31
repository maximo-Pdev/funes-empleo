"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InputVisibilityToggle({ inputId, description, visible, onToggle }: {
  inputId: string;
  description: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const label = `${visible ? "Ocultar" : "Mostrar"} ${description}`;
  return <Button type="button" variant="outline" size="icon" data-slot="input-visibility-toggle"
    aria-controls={inputId} aria-pressed={visible} aria-label={label} title={label} onClick={onToggle}>
    {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
  </Button>;
}
