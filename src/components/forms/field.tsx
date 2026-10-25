"use client";
import { Children, cloneElement, isValidElement, useContext, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { FormErrorsContext, FormMarkersContext, FormSummarizedFieldsContext } from "./form";

type ElementProps = { children?: ReactNode; id?: string; required?: boolean; type?: string; "aria-labelledby"?: string;
  "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false" };
function findControl(children: ReactNode): ReactElement<ElementProps> | undefined {
  let found: ReactElement<ElementProps> | undefined;
  Children.forEach(children, child => {
    if (found || !isValidElement<ElementProps>(child)) return;
    if (["input", "textarea", "select"].includes(String(child.type)) && child.props.type !== "hidden") found = child;
    else found = findControl(child.props.children);
  });
  return found;
}

function decorate(children: ReactNode, control: ReactElement<ElementProps>, id: string, error: string | undefined, hint?: string, hideError = false): ReactNode {
  return Children.map(children, child => {
    if (!isValidElement<ElementProps>(child)) return child;
    if (child === control) return cloneElement(child, { id,
      "aria-labelledby": child.props["aria-labelledby"] || `${id}-label`,
      "aria-invalid": error ? true : child.props["aria-invalid"],
      "aria-describedby": [child.props["aria-describedby"], hint && `${id}-hint`, error && !hideError && `${id}-error`].filter(Boolean).join(" ") || undefined });
    return child.props.children ? cloneElement(child, {}, decorate(child.props.children, control, id, error, hint, hideError)) : child;
  });
}

function captionWithoutControl(children: ReactNode, control?: ReactElement<ElementProps>): ReactNode {
  return Children.map(children, child => {
    if (child === control) return null;
    if (!isValidElement<ElementProps>(child) || !child.props.children) return child;
    return cloneElement(child, {}, captionWithoutControl(child.props.children, control));
  });
}

type FieldProps = ComponentProps<"label"> & { label?: ReactNode; error?: string; hint?: string };
export function Field({ children, label, error: suppliedError, hint, className, ...attributes }: FieldProps) {
  const generatedId = useId();
  const errors = useContext(FormErrorsContext);
  const summarizedFields = useContext(FormSummarizedFieldsContext);
  const { policy, missing } = useContext(FormMarkersContext);
  const control = findControl(children);
  const id = control?.props.id ?? generatedId;
  const error = suppliedError || errors[id];
  const hideError = !suppliedError && summarizedFields.includes(id);
  const markerState = missing.includes(id) ? "missing" : policy === "muted" ? "muted" : "required";
  const showMarker = control?.props.required && (policy !== "on-missing" || missing.includes(id));
  const marker = showMarker ? <span aria-hidden="true" data-required-marker data-marker-state={markerState} className="ml-1 font-bold text-red-700">*</span> : null;
  const decorated = control ? decorate(label ? children : control, control, id, error, hint, hideError) : children;
  const caption = <span><span id={`${id}-label`}>{label || captionWithoutControl(children, control)}</span>{marker}</span>;
  const checkbox = control?.props.type === "checkbox" || control?.props.type === "radio";
  return <div className="min-w-0" data-form-field>
    <label {...attributes} htmlFor={control ? id : attributes.htmlFor} className={className}>
      {label ? caption : checkbox ? <>{decorated}{caption}</> : <>{caption}{decorated}</>}
    </label>
    {label && decorated}
    {hint && <p id={`${id}-hint`} className="text-sm text-slate-700">{hint}</p>}
    {error && !hideError && <p id={`${id}-error`} role={suppliedError ? "alert" : undefined} data-field-error className="text-sm font-semibold text-red-800">{error}</p>}
  </div>;
}
