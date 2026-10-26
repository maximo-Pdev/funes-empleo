"use client";

// Adapted from official shadcn/ui base-nova combobox registry (single-select, searchable),
// without the InputGroup dependency. Municipal tokens applied.
import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({ className, children, ...props }: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={state => cn(
        "flex min-h-11 w-full items-center justify-between gap-2 rounded-sm border border-brand-text bg-surface px-3 py-2 text-left text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg:not([class*='size-'])]:size-4",
        typeof className === "function" ? className(state) : className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<Button variant="ghost" size="icon-xs" />}
      className={state => cn(typeof className === "function" ? className(state) : className)}
      {...props}
    >
      <X className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({ className, children, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <div className={cn("relative flex min-h-11 items-center rounded-sm border border-brand-text bg-surface px-3", typeof className === "function" ? undefined : className)}>
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        {...props}
      />
      {children}
    </div>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset">) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} className="isolate z-50">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={state => cn(
            "relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-hidden rounded-md bg-surface shadow-md ring-1 ring-border duration-100",
            typeof className === "function" ? className(state) : className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={state => cn("no-scrollbar max-h-72 overflow-y-auto overscroll-contain p-1", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

function ComboboxItem({ className, children, ...props }: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={state => cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-surface-muted data-highlighted:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        typeof className === "function" ? className(state) : className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />}
      >
        <Check className="pointer-events-none text-primary" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" className={state => cn(typeof className === "function" ? className(state) : className)} {...props} />;
}

function ComboboxLabel({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) {
  return <ComboboxPrimitive.GroupLabel data-slot="combobox-label" className={state => cn("px-2 py-1.5 text-xs text-muted-foreground", typeof className === "function" ? className(state) : className)} {...props} />;
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />;
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={state => cn("hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex", typeof className === "function" ? className(state) : className)}
      {...props}
    />
  );
}

function ComboboxChips({ className, ...props }: ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={state => cn(
        "flex min-h-11 flex-wrap items-center gap-1 rounded-sm border border-brand-text bg-surface px-2.5 py-1 text-sm",
        typeof className === "function" ? className(state) : className
      )}
      {...props}
    />
  );
}

function ComboboxChip({ className, children, ...props }: ComboboxPrimitive.Chip.Props) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={state => cn(
        "flex h-7 items-center gap-1 rounded-sm bg-surface-muted px-1.5 text-xs font-medium whitespace-nowrap",
        typeof className === "function" ? className(state) : className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ChipRemove className="opacity-50 hover:opacity-100">
        <X className="size-3" />
      </ComboboxPrimitive.ChipRemove>
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput(props: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className="min-w-16 flex-1 bg-transparent outline-none"
      {...props}
    />
  );
}

export {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
};
