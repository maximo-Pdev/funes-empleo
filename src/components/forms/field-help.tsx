"use client";

import { Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function FieldHelp({ description, label }: { description: string; label: string }) {
  return (
    <span className="ml-1 inline-flex align-middle">
      <HoverCard>
        <HoverCardTrigger
          aria-label={`Ayuda sobre ${label}`}
          className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-4" aria-hidden="true" />
        </HoverCardTrigger>
        <HoverCardContent>
          <p>{description}</p>
        </HoverCardContent>
      </HoverCard>
    </span>
  );
}
