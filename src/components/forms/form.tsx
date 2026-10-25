"use client";
import { createContext, useEffect, useRef, useState, type ComponentProps } from "react";
import { controlError, controlMissing, formControls, formErrors, type FormRequirement } from "./validation";
import styles from "./form.module.css";

export const FormErrorsContext = createContext<Record<string, string>>({});
export const FormSummarizedFieldsContext = createContext<readonly string[]>([]);
export type RequiredMarkerPolicy = "always" | "on-missing" | "muted";
export const FormMarkersContext = createContext<{ policy: RequiredMarkerPolicy; missing: readonly string[] }>({ policy: "always", missing: [] });
type FormProps = Omit<ComponentProps<"form">, "ref"> & {
  result?: { success?: boolean; status?: string };
  requirements?: readonly FormRequirement[];
  preserveOnSuccess?: boolean;
  requiredMarkers?: RequiredMarkerPolicy;
  missingFieldMessages?: "inline" | "summary";
};

export function Form({ result, requirements, preserveOnSuccess = false, requiredMarkers = "always", missingFieldMessages = "inline", children, className = "", onSubmitCapture, onChange, onReset,
  noValidate: _noValidate, ...attributes }: FormProps) {
  const form = useRef<HTMLFormElement>(null);
  const allowReset = useRef(false);
  const attempted = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [summarizedFields, setSummarizedFields] = useState<string[]>([]);
  function validate(element: HTMLFormElement) {
    const next = formErrors(element, requirements);
    setErrors(next);
    const missingControls = formControls(element).filter(controlMissing);
    setMissing(missingControls.map(control => control.id));
    setSummarizedFields(missingControls.filter(control =>
      (control instanceof HTMLTextAreaElement || (control instanceof HTMLInputElement && !["checkbox", "radio", "file"].includes(control.type)))
      && !control.validity.customError && next[control.id] === controlError(control)
    ).map(control => control.id));
    return next;
  }
  const count = Object.keys(errors).length;
  void _noValidate;
  useEffect(() => {
    if (!preserveOnSuccess && (result?.success || result?.status === "success")) {
      allowReset.current = true;
      form.current?.reset();
      allowReset.current = false;
      attempted.current = false;
    }
  }, [result, preserveOnSuccess]);

  return <FormErrorsContext value={errors}><FormSummarizedFieldsContext value={missingFieldMessages === "summary" ? summarizedFields : []}><FormMarkersContext value={{ policy: requiredMarkers, missing }}>
    <form {...attributes} ref={form} className={`${styles.form} ${className}`} noValidate
      onSubmitCapture={event => {
        onSubmitCapture?.(event);
        if (event.defaultPrevented) return;
        attempted.current = true;
        const next = validate(event.currentTarget);
        if (Object.keys(next).length) {
          event.preventDefault();
          event.stopPropagation();
          formControls(event.currentTarget).find(control => next[control.id])?.focus();
        }
      }}
      onChange={event => {
        onChange?.(event);
        if (attempted.current) validate(event.currentTarget);
      }}
      onReset={event => {
        onReset?.(event);
        if (!allowReset.current && typeof attributes.action === "function") event.preventDefault();
      }}>
      {count > 0 && <p role="alert" className={styles.summary}>Revisá {count === 1 ? "el campo indicado" : `los ${count} campos indicados`}.</p>}
      {requirements?.map(requirement => <p key={requirement.names.join("-")} className="text-sm"><span aria-hidden="true" data-required-marker className="font-bold text-red-700">*</span> {requirement.message}</p>)}
      {children}
    </form>
  </FormMarkersContext></FormSummarizedFieldsContext></FormErrorsContext>;
}
