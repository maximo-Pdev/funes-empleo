"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "./button";
import { Pagination, PaginationContent, PaginationItem } from "./pagination";
import { HISTORY_PAGE_SIZE, RECORD_PAGE_SIZE } from "@/lib/collections/limits";
import { cn } from "@/lib/utils";

/** Presentation only: children are already authorized and rendered on the server. */
export function BoundedList({ children, label, as: Tag = "ul", className, mode = "more", initialIndex = 0 }: {
  children: ReactNode; label: string; as?: "ul" | "ol" | "div"; className?: string;
  mode?: "more" | "pages"; initialIndex?: number;
}) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const size = mode === "more" ? HISTORY_PAGE_SIZE : RECORD_PAGE_SIZE;
  const [page, setPage] = useState(() => Math.floor(Math.max(0, initialIndex) / size));
  const [visible, setVisible] = useState(size);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const lastPage = Math.max(0, Math.ceil(items.length / size) - 1);
  const safePage = Math.min(page, lastPage);
  const start = mode === "pages" ? safePage * size : 0;
  const end = Math.min(items.length, mode === "pages" ? start + size : visible);

  useEffect(() => {
    function revealHash() {
      let hash: string;
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!hash) return;
      const index = items.findIndex(item => isValidElement<{ id?: string }>(item) && item.props.id === hash);
      if (index < 0) return;
      setPage(Math.floor(index / size));
      setVisible(Math.ceil((index + 1) / size) * size);
      setFocusIndex(index);
    }
    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => window.removeEventListener("hashchange", revealHash);
  }, [items, size]);

  useEffect(() => {
    if (focusIndex === null) return;
    const item = Array.from(root.current?.firstElementChild?.children ?? [])
      .find(element => element.getAttribute("data-record-index") === String(focusIndex)) as HTMLElement | undefined;
    item?.focus({ preventScroll: true });
    item?.scrollIntoView?.({ block: "nearest" });
  }, [focusIndex, end, start]);

  if (!items.length) return null;
  return <div ref={root} className="min-w-0" data-bounded-list={label}>
    <Tag id={id} className={className}>{items.slice(start, end).map((item, offset) =>
      isValidElement<HTMLAttributes<HTMLElement>>(item)
        ? cloneElement(item, { tabIndex: -1, className: cn(item.props.className, "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"), ...{ "data-record-index": start + offset } }) : item)}
    </Tag>
    <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm text-muted-foreground">
      {label}: mostrando {start + 1}–{end} de {items.length}
    </p>
    {mode === "more" && end < items.length && <Button type="button" variant="secondary" className="mt-3"
      aria-controls={id} aria-label={`Mostrar más: ${label}`} onClick={() => { setFocusIndex(end); setVisible(end + size); }}>Mostrar más</Button>}
    {mode === "pages" && items.length > size && <Pagination aria-label={`Páginas: ${label}`} className="mt-3">
      <PaginationContent className="flex-wrap">
        <PaginationItem><Button type="button" variant="secondary" aria-controls={id} disabled={safePage === 0}
          onClick={() => { setPage(safePage - 1); setFocusIndex((safePage - 1) * size); }}>Anterior</Button></PaginationItem>
        <PaginationItem><span className="px-2 text-sm">Página {safePage + 1} de {lastPage + 1}</span></PaginationItem>
        <PaginationItem><Button type="button" variant="secondary" aria-controls={id} disabled={safePage === lastPage}
          onClick={() => { setPage(safePage + 1); setFocusIndex((safePage + 1) * size); }}>Siguiente</Button></PaginationItem>
      </PaginationContent>
    </Pagination>}
  </div>;
}
