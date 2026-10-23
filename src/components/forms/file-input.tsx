"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Field } from "./field";
import styles from "./file-input.module.css";

type FileInputProps = Omit<ComponentProps<"input">, "type"> & { label: string; hint?: string; error?: string };

export function FileInput({ label, hint, error, onChange, className = "", ...attributes }: FileInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState("");
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    function reset(event: Event) {
      queueMicrotask(() => { if (!event.defaultPrevented) setFilename(""); });
    }
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, []);
  return <Field label={label} hint={hint} error={error} className="block font-semibold">
    <div className={`${styles.picker} ${className}`}>
      <input {...attributes} ref={input} type="file" className={styles.native} onChange={event => {
        setFilename(Array.from(event.currentTarget.files ?? []).map(file => file.name).join(", "));
        onChange?.(event);
      }} />
      <span aria-hidden="true" className="shrink-0 rounded bg-secondary px-3 py-2 font-semibold text-primary">Seleccionar archivo</span>
      <span className="min-w-0 break-words text-sm" aria-live="polite">{filename || "Ningún archivo seleccionado"}</span>
    </div>
  </Field>;
}
