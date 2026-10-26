"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

export function LinkButton({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} data-slot="link-button" className={cn(buttonVariants({ variant: "primary" }), "max-w-full whitespace-normal text-center", className)} />;
}
