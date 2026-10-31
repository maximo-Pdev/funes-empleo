// Adapted from the official shadcn/ui base-nova breadcrumb registry.
import type { ComponentProps } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="Ruta de navegación" data-slot="breadcrumb" className={cn(className)} {...props} />;
}
export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return <ol data-slot="breadcrumb-list" className={cn("flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground", className)} {...props} />;
}
export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex min-w-0 items-center gap-1", className)} {...props} />;
}
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" className={cn("font-normal text-foreground", className)} {...props} />;
}
export function BreadcrumbSeparator({ children, className, ...props }: ComponentProps<"li">) {
  return <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>{children ?? <ChevronRight />}</li>;
}
