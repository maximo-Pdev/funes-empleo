"use client";

import { usePathname } from "next/navigation";
import { HomeLoading, PageLoading } from "@/components/ui/workspace-loading";

export default function Loading() {
  const pathname = usePathname();
  return pathname === "/" ? <HomeLoading /> : <PageLoading offerDetail={pathname?.startsWith("/ofertas/")} />;
}
