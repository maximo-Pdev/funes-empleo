import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Composition adapted from shadcn/ui's Base Nova sidebar.
// Reference: https://ui.shadcn.com/docs/components/base/sidebar
// Kept local to reuse the portal's tokens without replacing existing primitives.
export function Sidebar({ className, ...props }: ComponentProps<"aside">) {
  return <aside data-slot="sidebar" className={cn("flex flex-col", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col overflow-auto", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex shrink-0 flex-col", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("flex min-w-0 flex-col", className)} {...props} />;
}

export function SidebarMenuItem(props: ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" {...props} />;
}
