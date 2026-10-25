export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type FormRequirement = { names: readonly string[]; message: string; rule?: "at-least-one" | "date-order" };

export function formControls(form: HTMLFormElement): FormControl[] {
  return Array.from(form.elements).filter((element): element is FormControl =>
    (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
    && element.willValidate);
}

export function controlMissing(control: FormControl): boolean {
  if (!control.willValidate) return false;
  return control instanceof HTMLInputElement && control.type === "file"
    ? control.required && !control.files?.length
    : control.validity.valueMissing || (control.required && control.type !== "checkbox" && !control.value.trim());
}

export function controlError(control: FormControl): string {
  if (!control.willValidate) return "";
  if (control.validity.customError) return control.validationMessage;
  if (controlMissing(control)) {
    if (control.type === "checkbox" || control.type === "radio") return "Confirmá esta opción para continuar.";
    if (control.type === "file") return "Seleccioná un archivo para continuar.";
    if (control instanceof HTMLSelectElement) return "Elegí una opción.";
    return "Completá este campo.";
  }
  if (control.validity.typeMismatch) return control.type === "email"
    ? "Ingresá un correo válido, por ejemplo nombre@correo.com." : "Ingresá una dirección válida.";
  if (control.validity.badInput) return "Ingresá un valor válido para este campo.";
  if (control.validity.rangeUnderflow) return `Ingresá un valor mayor o igual a ${control.getAttribute("min")}.`;
  if (control.validity.rangeOverflow) return `Ingresá un valor menor o igual a ${control.getAttribute("max")}.`;
  if (control.validity.stepMismatch) return "Ingresá un valor que respete el intervalo permitido.";
  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    if (control.value && control.minLength > 0 && control.value.length < control.minLength) return `Ingresá al menos ${control.minLength} caracteres.`;
    if (control.maxLength >= 0 && control.value.length > control.maxLength) return `Usá como máximo ${control.maxLength} caracteres.`;
  }
  if (control.validity.patternMismatch) return control.getAttribute("title") || "Revisá el formato indicado para este campo.";
  if (control instanceof HTMLInputElement && control.type === "file" && control.files?.length) {
    const maxBytes = Number(control.dataset.maxBytes);
    if (maxBytes > 0 && Array.from(control.files).some(file => file.size > maxBytes || !file.size)) {
      return control.dataset.fileError || "El archivo está vacío o supera el tamaño permitido.";
    }
    const accepted = control.accept.split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
    if (accepted.length && Array.from(control.files).some(file => !accepted.some(value =>
      value.startsWith(".") ? file.name.toLowerCase().endsWith(value) : value.endsWith("/*")
        ? file.type.toLowerCase().startsWith(value.slice(0, -1)) : file.type.toLowerCase() === value))) {
      return "Elegí un archivo del formato indicado.";
    }
  }
  return "";
}

export function formErrors(form: HTMLFormElement, requirements: readonly FormRequirement[] = []) {
  const controls = formControls(form);
  const errors: Record<string, string> = {};
  for (const control of controls) {
    const message = controlError(control);
    if (message) errors[control.id] = message;
  }
  const password = controls.find(control => control.name === "password");
  const confirmation = controls.find(control => control.name === "confirmation");
  if (password && confirmation?.value && password.value !== confirmation.value) {
    errors[confirmation.id] = "Las contraseñas deben coincidir.";
  }
  for (const requirement of requirements) {
    const group = controls.filter(control => requirement.names.includes(control.name));
    if (requirement.rule === "date-order") {
      const start = group.find(control => control.name === requirement.names[0]);
      const end = group.find(control => control.name === requirement.names[1]);
      if (start?.value && end?.value && start.value > end.value) errors[end.id] = requirement.message;
      continue;
    }
    if (group.length && !group.some(control => control.type === "checkbox" || control.type === "radio"
      ? (control as HTMLInputElement).checked : control.value.trim())) {
      for (const control of group) errors[control.id] = requirement.message;
    }
  }
  return errors;
}
